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
        o.currency,
        o.status,
        o.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product_name', COALESCE(oi.product_name, p.name),
            'options', oi.options
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
                'product_name', COALESCE(oi.product_name, p.name),
                'options', oi.options,
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

const MAX_ITEMS = 100;
const MAX_QUANTITY = 999;
const MAX_MEAT_COUNT = 4;
// "+54 11 5555-1234", "1155551234"...: dígitos, espacios y guiones, con "+" opcional al inicio.
const PHONE_PATTERN = /^\+?[0-9][0-9 -]{5,18}$/;

// Devuelve un mensaje de error si los datos del pedido no son válidos, o null si lo son.
function validateOrderInput({ customerName, customerPhone, items }) {
  if (typeof customerName !== "string" || !customerName.trim() || customerName.trim().length > 150) {
    return "Nombre del cliente no válido";
  }
  if (typeof customerPhone !== "string" || !PHONE_PATTERN.test(customerPhone.trim())) {
    return "Teléfono no válido";
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return `El pedido debe tener entre 1 y ${MAX_ITEMS} productos`;
  }
  for (const item of items) {
    const { productId, quantity, meatCount } = item || {};
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return "Datos de producto inválidos";
    }
    if (meatCount != null && (!Number.isInteger(meatCount) || meatCount < 1 || meatCount > MAX_MEAT_COUNT)) {
      return "Opciones de producto inválidas";
    }
  }
  return null;
}

exports.createOrder = async (req, res) => {
  let connection;
  try {
    const { slug } = req.params;

    const validationError = validateOrderInput(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const customerName = req.body.customerName.trim();
    const customerPhone = req.body.customerPhone.trim();
    const { items } = req.body;

    // Obtener el business_id desde el slug
    const [businesses] = await pool.query(
      "SELECT id, currency FROM businesses WHERE slug = ? AND is_active = TRUE",
      [slug]
    );

    if (businesses.length === 0) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const { id: businessId, currency } = businesses[0];

    // Precio y nombre salen de la BD, nunca del cliente. El total se suma en céntimos
    // para evitar errores de redondeo de los decimales (p. ej. 2.9699999999999998).
    let totalCents = 0;
    const orderItems = [];

    for (const item of items) {
      const [products] = await pool.query(
        "SELECT id, name, price, product_type FROM products WHERE id = ? AND business_id = ? AND is_active = TRUE",
        [item.productId, businessId]
      );

      if (products.length === 0) {
        return res.status(400).json({ message: "Uno de los productos ya no está disponible" });
      }

      const product = products[0];
      totalCents += Math.round(Number(product.price) * 100) * item.quantity;

      // La cantidad de carnes solo tiene sentido en hamburguesas; en el resto se ignora.
      const options = product.product_type === "burger" && item.meatCount
        ? { meatCount: item.meatCount }
        : null;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        options,
      });
    }

    const total = totalCents / 100;

    // Pedido y líneas en una transacción: o se guarda todo o nada.
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      "INSERT INTO orders (business_id, customer_name, customer_phone, total, currency, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [businessId, customerName, customerPhone, total, currency]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, product_name, quantity, price, options) VALUES (?, ?, ?, ?, ?, ?)",
        [orderId, item.productId, item.productName, item.quantity, item.price,
          item.options ? JSON.stringify(item.options) : null]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Pedido creado correctamente",
      order: {
        id: orderId,
        total: total,
        currency,
        status: 'pending'
      }
    });

  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error(error);
    res.status(500).json({ message: "Error creando el pedido" });
  } finally {
    if (connection) connection.release();
  }
};