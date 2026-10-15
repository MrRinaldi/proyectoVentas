const pool = require("../config/db");

exports.getProducts = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.business_id = ?`,
      [businessId]
    );

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo productos" });
  }
};

// Devuelve un mensaje de error si los datos del producto no son válidos, o null si lo son.
async function validateProduct(businessId, { name, price, category_id }) {
  if (!name || !price) {
    return "Nombre y precio son obligatorios";
  }

  if (!(Number(price) > 0)) {
    return "El precio debe ser un número mayor que cero";
  }

  if (category_id) {
    const [categories] = await pool.query(
      "SELECT id FROM categories WHERE id = ? AND business_id = ?",
      [category_id, businessId]
    );
    if (categories.length === 0) {
      return "Categoría no válida";
    }
  }

  return null;
}

exports.createProduct = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { name, description, price, category_id, image, product_type, is_active = true } = req.body;

    const validationError = await validateProduct(businessId, req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    await pool.query(
      `INSERT INTO products (business_id, category_id, name, description, price, image, product_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, category_id || null, name, description || null, price, image || null, product_type || null, is_active ? 1 : 0]
    );

    res.status(201).json({ message: "Producto creado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando producto" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { name, description, price, category_id, is_active, image, product_type } = req.body;

    const validationError = await validateProduct(businessId, req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // image_medium no se toca: la pantalla de gestión no lo envía y se borraría.
    const [result] = await pool.query(
      `UPDATE products
       SET name = ?, description = ?, price = ?, category_id = ?, is_active = ?, image = ?, product_type = ?
       WHERE id = ? AND business_id = ?`,
      [name, description || null, price, category_id || null, is_active ? 1 : 0, image || null, product_type || null, id, businessId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando producto" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM products WHERE id = ? AND business_id = ?",
      [id, businessId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error eliminando producto" });
  }
};