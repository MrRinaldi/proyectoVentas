-- Añade la columna product_type (usada por la tienda tipo burger y la gestión de productos)
-- a bases de datos creadas antes de que existiera en init.sql.
-- Ejecutar una sola vez. Si la columna ya existe (por ejemplo, porque se ejecutó
-- "backend/qrys db/add-product-type.sql"), MySQL da error "Duplicate column" y no cambia nada.
ALTER TABLE products ADD COLUMN product_type VARCHAR(50) NULL AFTER image_medium;
