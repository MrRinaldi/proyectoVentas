-- Conserva el historial de pedidos y guarda las opciones de cada línea:
-- - product_name: copia del nombre del producto al hacer el pedido.
-- - options: opciones elegidas por el cliente (p. ej. {"meatCount": 2}).
-- - Borrar un producto ya no borra sus líneas de pedidos antiguos (antes ON DELETE CASCADE).
-- Ejecutar una sola vez. order_items_ibfk_2 es el nombre que MySQL dio a la clave de product_id
-- en bases de datos creadas con el init.sql anterior.
ALTER TABLE order_items
  ADD COLUMN product_name VARCHAR(150) COLLATE utf8mb4_unicode_ci NULL AFTER product_id,
  ADD COLUMN options JSON NULL AFTER price;

UPDATE order_items oi JOIN products p ON p.id = oi.product_id
SET oi.product_name = p.name
WHERE oi.product_name IS NULL;

ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2;
ALTER TABLE order_items MODIFY product_id INT NULL;
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
