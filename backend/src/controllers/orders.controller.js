const pool = require("../config/db");
const whatsappService = require("../services/whatsapp.service");

exports.getOrders = async (req, res) => {
  try {
    const { slug } = req.params;

    // Primero obtener el business_id desde el slug
    const [businesses] = await pool.query(
      "SELECT id FROM businesses WHERE slug = ?",
      [slug]
    );

    if (businesses.length === 0) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const businessId = businesses[0].id;

    // Un dueño solo puede ver y modificar los pedidos de su propia tienda.
    if (businessId !== req.user.businessId) {
      return res.status(403).json({ message: "Acceso denegado." });
    }

    // Obtener todas las órdenes del negocio con sus items
    const [orders] = await pool.query(`
      SELECT
        o.id,
        o.customer_name,
        o.customer_phone,
        o.total,
        o.status,
        o.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product_name', p.name
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.business_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [businessId]);

    res.json({ orders });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo órdenes" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { slug, orderId } = req.params;
    const { status } = req.body;

    // Validar que el status sea válido
    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    // Primero obtener el business_id desde el slug
    const [businesses] = await pool.query(
      "SELECT id FROM businesses WHERE slug = ?",
      [slug]
    );

    if (businesses.length === 0) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const businessId = businesses[0].id;

    // Un dueño solo puede ver y modificar los pedidos de su propia tienda.
    if (businessId !== req.user.businessId) {
      return res.status(403).json({ message: "Acceso denegado." });
    }

    // Verificar que la orden pertenece al negocio
    const [orders] = await pool.query(
      "SELECT id FROM orders WHERE id = ? AND business_id = ?",
      [orderId, businessId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    // Actualizar el estado de la orden
    await pool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId]
    );

    // Si el estado cambió a 'confirmed', enviar mensaje de WhatsApp
    if (status === 'confirmed') {
      try {
        // Obtener datos completos de la orden y negocio
        const [orderData] = await pool.query(`
          SELECT
            o.*,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'product_name', p.name,
                'quantity', oi.quantity,
                'price', oi.price
              )
            ) as items
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE o.id = ?
          GROUP BY o.id
        `, [orderId]);

        const [businessData] = await pool.query(
          "SELECT * FROM businesses WHERE id = ?",
          [businessId]
        );

        if (orderData.length > 0 && businessData.length > 0) {
          const order = orderData[0];
          const business = businessData[0];
          const customer = {
            name: order.customer_name,
            phone: order.customer_phone
          };

          // Enviar mensaje de WhatsApp si el negocio tiene número configurado
          if (business.whatsapp_number) {
            await whatsappService.sendOrderMessage(business, order, customer);
          }
        }
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp:', whatsappError);
        // No fallar la actualización por error en WhatsApp
      }
    }

    res.json({ message: "Estado de orden actualizado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando estado de orden" });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { slug } = req.params;
    const { customerName, customerPhone, items } = req.body;

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({ message: "Faltan datos del pedido" });
    }

    // Obtener el business_id desde el slug
    const [businesses] = await pool.query(
      "SELECT id FROM businesses WHERE slug = ?",
      [slug]
    );

    if (businesses.length === 0) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const businessId = businesses[0].id;

    // Calcular el total y validar productos
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Datos de producto inválidos" });
      }

      const [products] = await pool.query(
        "SELECT id, name, price FROM products WHERE id = ? AND business_id = ? AND is_active = TRUE",
        [item.productId, businessId]
      );

      if (products.length === 0) {
        return res.status(400).json({ message: `Producto ${item.productId} no encontrado` });
      }

      const product = products[0];
      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Crear la orden
    const [orderResult] = await pool.query(
      "INSERT INTO orders (business_id, customer_name, customer_phone, total, status) VALUES (?, ?, ?, ?, 'pending')",
      [businessId, customerName, customerPhone, total]
    );

    const orderId = orderResult.insertId;

    // Crear los items de la orden
    for (const item of orderItems) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    res.status(201).json({
      message: "Pedido creado correctamente",
      order: {
        id: orderId,
        total: total,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando el pedido" });
  }
};