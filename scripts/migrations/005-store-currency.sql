-- Fase 8: moneda e idioma por tienda, y moneda guardada en cada pedido.
-- Ejecutar una sola vez. Las tiendas existentes quedan en ARS / es-AR: cada una puede cambiarlo
-- desde "Mi tienda" (los pedidos antiguos conservan la moneda con la que se hicieron).
ALTER TABLE businesses
  ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'ARS' AFTER phone,
  ADD COLUMN locale VARCHAR(20) NOT NULL DEFAULT 'es-AR' AFTER currency;

ALTER TABLE orders
  ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'ARS' AFTER total;
