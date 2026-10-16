-- Fase 9: clientes finales por tienda y pedidos vinculados a su cliente.
-- Ejecutar una sola vez. Los pedidos existentes quedan sin cliente (compras sin cuenta).
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(150) NOT NULL COLLATE utf8mb4_unicode_ci,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_customers_business_email (business_id, email),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

ALTER TABLE orders
  ADD COLUMN customer_id INT NULL AFTER business_id,
  ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
