-- Corrige las rutas de imágenes de los datos de ejemplo: el backend sirve las imágenes en
-- /api/images/..., pero init.sql las guardaba como /images/... y no cargaban.
-- Solo cambia rutas que empiezan por /images/, así que ejecutarlo dos veces no hace nada.
UPDATE products SET image = CONCAT('/api', image) WHERE image LIKE '/images/%';
UPDATE products SET image_medium = CONCAT('/api', image_medium) WHERE image_medium LIKE '/images/%';
UPDATE businesses SET logo = CONCAT('/api', logo) WHERE logo LIKE '/images/%';
