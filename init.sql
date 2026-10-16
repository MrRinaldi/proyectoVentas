-- Configurar charset UTF-8 para aceptar acentos y caracteres especiales
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
ALTER DATABASE ventas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL COLLATE utf8mb4_unicode_ci,
    slug VARCHAR(150) NOT NULL UNIQUE COLLATE utf8mb4_unicode_ci,
    type ENUM('food','grocery','perfumery') DEFAULT 'grocery',
    logo VARCHAR(255),
    primary_color VARCHAR(20),
    whatsapp_number VARCHAR(20),
    phone VARCHAR(20),
    -- Moneda (código ISO 4217) e idioma/región (BCP 47) con los que la tienda muestra los importes.
    currency CHAR(3) NOT NULL DEFAULT 'ARS',
    locale VARCHAR(20) NOT NULL DEFAULT 'es-AR',
    -- Zona horaria (IANA) para agrupar ventas por día en las estadísticas.
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    -- FALSE = tienda suspendida por el superadministrador: no se muestra ni acepta pedidos.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- NULL solo para el superadministrador (no pertenece a ninguna tienda).
    business_id INT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin','owner','admin') NOT NULL DEFAULT 'owner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Clientes finales: cada uno pertenece a una tienda. El mismo email puede ser cliente de varias
-- tiendas (cuentas distintas). Separados de `users` (personal) para no mezclar permisos.
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

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    category_id INT,
    name VARCHAR(150) NOT NULL COLLATE utf8mb4_unicode_ci,
    description TEXT COLLATE utf8mb4_unicode_ci,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    image_medium VARCHAR(255),
    product_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);    
    
    
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    -- Cliente registrado que hizo el pedido; NULL si compró sin cuenta.
    customer_id INT NULL,
    customer_name VARCHAR(150) NOT NULL COLLATE utf8mb4_unicode_ci,
    customer_phone VARCHAR(20) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    -- Moneda de la tienda al hacer el pedido: no cambia aunque la tienda cambie de moneda después.
    currency CHAR(3) NOT NULL DEFAULT 'ARS',
    status ENUM('pending','confirmed','delivered','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    -- Copia del nombre al hacer el pedido: el historial no cambia si el producto se edita o se borra.
    product_name VARCHAR(150) COLLATE utf8mb4_unicode_ci,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    -- Opciones elegidas por el cliente, p. ej. {"meatCount": 2} en hamburguesas.
    options JSON NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- =====================================
-- DATOS DE EJEMPLO PARA LA BASE DE DATOS
-- =====================================

-- =====================================
-- TABLA: negocios
-- =====================================
INSERT INTO businesses (name, slug, type, logo, primary_color, whatsapp_number, phone) VALUES
('La Tienda del Barrio', 'la-tienda-del-barrio', 'grocery', '/api/images/tienda-logo.png', '#FF6B6B', '+34612345678', '+34612345678'),
('Comidas Rápidas Don Jorge', 'comidas-don-jorge', 'food', '/api/images/don-jorge-logo.png', '#4ECDC4', '+34612345679', '+34612345679'),
('Perfumería Elegancia', 'perfumeria-elegancia', 'perfumery', '/api/images/elegancia-logo.png', '#95E1D3', '+34612345680', '+34612345680');
-- Monedas de ejemplo (por defecto ARS / es-AR).
UPDATE businesses SET currency = 'EUR', locale = 'es-ES', timezone = 'Europe/Madrid' WHERE slug IN ('la-tienda-del-barrio', 'comidas-don-jorge');
UPDATE businesses SET currency = 'USD', locale = 'en-US', timezone = 'America/New_York' WHERE slug = 'perfumeria-elegancia';

-- =====================================
-- TABLA: usuarios
-- =====================================
-- NOTA: Las contraseñas están hasheadas con bcrypt (en producción usar siempre contraseñas hasheadas)
-- Las contraseñas de ejemplo corresponden a: "password123"
INSERT INTO users (business_id, email, password, role) VALUES
(1, 'owner@tienda.com', '$2b$10$68dLXV5zdo/RgStyCH40jOhkv8DNl1D0awnXi3JZbZb8hLDydWvmC', 'owner'),
(1, 'admin@tienda.com', '$2b$10$68dLXV5zdo/RgStyCH40jOhkv8DNl1D0awnXi3JZbZb8hLDydWvmC', 'admin'),
(2, 'owner@comidas.com', '$2b$10$68dLXV5zdo/RgStyCH40jOhkv8DNl1D0awnXi3JZbZb8hLDydWvmC', 'owner'),
(3, 'owner@perfumeria.com', '$2b$10$68dLXV5zdo/RgStyCH40jOhkv8DNl1D0awnXi3JZbZb8hLDydWvmC', 'owner'),
-- Superadministrador de la plataforma (solo datos de desarrollo).
(NULL, 'admin@plataforma.com', '$2b$10$68dLXV5zdo/RgStyCH40jOhkv8DNl1D0awnXi3JZbZb8hLDydWvmC', 'superadmin');

-- =====================================
-- TABLA: categorías
-- =====================================
-- Categorías para tienda de abarrotes
INSERT INTO categories (business_id, name) VALUES
(1, 'Frutas y Verduras'),
(1, 'Lácteos'),
(1, 'Bebidas'),
(1, 'Panadería'),
-- Categorías para restaurante de comida rápida
(2, 'Hamburguesas'),
(2, 'Pizza'),
(2, 'Bebidas'),
(2, 'Postres'),
-- Categorías para perfumería
(3, 'Perfumes para Hombre'),
(3, 'Perfumes para Mujer'),
(3, 'Colonias'),
(3, 'Fragancias Unisex');

-- =====================================
-- TABLA: productos
-- =====================================
INSERT INTO products (business_id, category_id, name, description, price, image, image_medium, is_active) VALUES
(1, 1, 'Manzanas Rojas', 'Manzanas frescas importadas de España', 2.50, '/api/images/manzanas.jpg', '/api/images/medium/manzanas.jpg', TRUE),
(1, 1, 'Lechuga Fresca', 'Lechuga romana recién cosechada', 1.80, '/api/images/lechuga.jpg', '/api/images/medium/lechuga.jpg', TRUE),
(1, 1, 'Tomates Maduros', 'Tomates de temporada muy frescos', 3.20, '/api/images/tomates.jpg', '/api/images/medium/tomates.jpg', TRUE),
(1, 2, 'Leche Entera 1L', 'Leche fresca de la mejor calidad', 1.45, '/api/images/leche.jpg', '/api/images/medium/leche.jpg', TRUE),
(1, 2, 'Queso Manchego', 'Queso curado de 6 meses', 8.99, '/api/images/queso.jpg', '/api/images/medium/queso.jpg', TRUE),
(1, 3, 'Agua Mineral 1.5L', 'Agua mineral natural sin gas', 0.99, '/api/images/agua.jpg', '/api/images/medium/agua.jpg', TRUE),
(1, 3, 'Refresco Cola 2L', 'Bebida refrescante popular', 2.50, '/api/images/cola.jpg', '/api/images/medium/cola.jpg', TRUE),
(1, 4, 'Pan Integral', 'Pan integral recién hecho', 2.99, '/api/images/pan-integral.jpg', '/api/images/medium/pan-integral.jpg', TRUE),
(1, 4, 'Croissant de Chocolate', 'Croissant francés con chocolate', 1.50, '/api/images/croissant.jpg', '/api/images/medium/croissant.jpg', TRUE),
(2, 5, 'Hamburguesa Clásica', 'Hamburguesa con carne de res, queso y lechuga', 8.99, '/api/images/hamburguesa.jpg', '/api/images/medium/hamburguesa.jpg', TRUE),
(2, 5, 'Hamburguesa Doble', 'Doble carne, queso suizo y tocino', 12.99, '/api/images/hamburguesa-doble.jpg', '/api/images/medium/hamburguesa-doble.jpg', TRUE),
(2, 6, 'Pizza Margarita', 'Pizza clásica con tomate, mozzarella y albahaca', 10.99, '/api/images/pizza-margarita.jpg', '/api/images/medium/pizza-margarita.jpg', TRUE),
(2, 6, 'Pizza Pepperoni', 'Pizza con pepperoni y queso extra', 12.99, '/api/images/pizza-pepperoni.jpg', '/api/images/medium/pizza-pepperoni.jpg', TRUE),
(2, 7, 'Coca Cola 500ml', 'Bebida refrescante', 2.00, '/api/images/cola-botella.jpg', '/api/images/medium/cola-botella.jpg', TRUE),
(2, 7, 'Jugo Natural', 'Jugo de naranja recién exprimido', 3.50, '/api/images/jugo.jpg', '/api/images/medium/jugo.jpg', TRUE),
(2, 8, 'Flan Casero', 'Flan de huevo cremoso', 3.99, '/api/images/flan.jpg', '/api/images/medium/flan.jpg', TRUE),
(2, 8, 'Brownie de Chocolate', 'Brownie fresco con chocolate derretido', 4.50, '/api/images/brownie.jpg', '/api/images/medium/brownie.jpg', TRUE),
(3, 9, 'Acqua di Gio', 'Fragancia fresca y acuática para caballero', 65.00, '/api/images/acqua-di-gio.jpg', '/api/images/medium/acqua-di-gio.jpg', TRUE),
(3, 9, 'Sauvage', 'Perfume elegante y sofisticado', 89.99, '/api/images/sauvage.jpg', '/api/images/medium/sauvage.jpg', TRUE),
(3, 10, 'Chanel No. 5', 'Clásico atemporal para mujer', 95.00, '/api/images/chanel-5.jpg', '/api/images/medium/chanel-5.jpg', TRUE),
(3, 10, 'Guilty', 'Fragancia seductora para mujer', 72.00, '/api/images/guilty.jpg', '/api/images/medium/guilty.jpg', TRUE),
(3, 11, 'Colonia Azul', 'Colonia fresca de uso diario', 15.99, '/api/images/colonia-azul.jpg', '/api/images/medium/colonia-azul.jpg', TRUE),
(3, 12, 'CK One', 'Fragancia unisex popular', 45.00, '/api/images/ck-one.jpg', '/api/images/medium/ck-one.jpg', TRUE);

-- =====================================
-- TABLA: pedidos
-- =====================================
INSERT INTO orders (business_id, customer_name, customer_phone, total, status) VALUES
(1, 'Juan Pérez', '+34655123456', 45.80, 'delivered'),
(1, 'María García', '+34655123457', 28.50, 'confirmed'),
(1, 'Carlos López', '+34655123458', 15.99, 'pending'),
(2, 'Ana Rodríguez', '+34655123459', 32.98, 'delivered'),
(2, 'Roberto Sánchez', '+34655123460', 29.98, 'confirmed'),
(2, 'Elena Martínez', '+34655123461', 18.50, 'pending'),
(3, 'Francisco Ruiz', '+34655123462', 154.99, 'delivered'),
(3, 'Sofía Fernández', '+34655123463', 89.99, 'confirmed'),
(3, 'Miguel Ángel', '+34655123464', 45.00, 'cancelled');

-- =====================================
-- TABLA: artículos del pedido
-- =====================================
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 3, 2.50),
(1, 4, 2, 1.45),
(1, 8, 1, 2.99),
(1, 6, 4, 0.99),
(2, 2, 2, 1.80),
(2, 5, 1, 8.99),
(2, 7, 1, 2.50),
(3, 9, 2, 1.50),
(4, 10, 1, 8.99),
(4, 11, 1, 12.99),
(4, 13, 1, 2.00),
(5, 12, 2, 10.99),
(5, 14, 1, 3.50),
(6, 16, 1, 3.99),
(6, 17, 1, 4.50),
(7, 18, 1, 65.00),
(7, 20, 1, 89.99),
(8, 19, 1, 89.99),
(9, 23, 1, 45.00);

-- Copia el nombre del producto en las líneas de los pedidos de ejemplo.
UPDATE order_items oi JOIN products p ON p.id = oi.product_id SET oi.product_name = p.name;

-- Tipos de producto de la tienda de comidas (iconos, colores y opciones como la cantidad de carnes).
UPDATE products SET product_type = 'burger' WHERE business_id = 2 AND category_id = 5;
UPDATE products SET product_type = 'drink' WHERE business_id = 2 AND category_id = 7;
UPDATE products SET product_type = 'dessert' WHERE business_id = 2 AND category_id = 8;

-- Los pedidos de ejemplo usan la moneda de su tienda.
UPDATE orders o JOIN businesses b ON b.id = o.business_id SET o.currency = b.currency;
