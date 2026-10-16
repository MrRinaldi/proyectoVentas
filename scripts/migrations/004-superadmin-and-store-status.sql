-- Fase 7: rol de superadministrador y tiendas que se pueden suspender.
-- Ejecutar una sola vez. Después, crear el superadministrador con:
--   docker exec -it backend_app node scripts/create-superadmin.js <email> <contraseña>
ALTER TABLE businesses
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER phone;

ALTER TABLE users
  MODIFY business_id INT NULL,
  MODIFY role ENUM('superadmin','owner','admin') NOT NULL DEFAULT 'owner';
