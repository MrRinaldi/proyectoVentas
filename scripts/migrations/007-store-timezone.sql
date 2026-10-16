-- Zona horaria de cada tienda (IANA, p. ej. America/Argentina/Buenos_Aires), usada para agrupar
-- las ventas por día en las estadísticas. Ejecutar una sola vez; cada tienda puede cambiarla en "Mi tienda".
ALTER TABLE businesses
  ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires' AFTER locale;
