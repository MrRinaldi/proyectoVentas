const pool = require("../config/db");

// Devuelve el nombre limpio si es válido (1 a 100 caracteres), o null.
function cleanName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100 ? trimmed : null;
}

exports.getCategories = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const [categories] = await pool.query(
      "SELECT * FROM categories WHERE business_id = ? ORDER BY name",
      [businessId]
    );

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo categorías" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const name = cleanName(req.body.name);

    if (!name) {
      return res.status(400).json({ message: "El nombre debe tener entre 1 y 100 caracteres" });
    }

    const [result] = await pool.query(
      "INSERT INTO categories (business_id, name) VALUES (?, ?)",
      [businessId, name]
    );

    res.status(201).json({ message: "Categoría creada", category: { id: result.insertId, name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando categoría" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const name = cleanName(req.body.name);

    if (!name) {
      return res.status(400).json({ message: "El nombre debe tener entre 1 y 100 caracteres" });
    }

    const [result] = await pool.query(
      "UPDATE categories SET name = ? WHERE id = ? AND business_id = ?",
      [name, id, businessId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    res.json({ message: "Categoría actualizada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando categoría" });
  }
};

// Los productos de la categoría borrada quedan "sin categoría" (ON DELETE SET NULL).
exports.deleteCategory = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM categories WHERE id = ? AND business_id = ?",
      [id, businessId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    res.json({ message: "Categoría eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error eliminando categoría" });
  }
};
