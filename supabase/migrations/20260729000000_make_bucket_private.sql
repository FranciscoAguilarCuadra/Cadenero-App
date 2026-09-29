-- Migración: Cambiar bucket 'prestamos' de público a privado
-- Esto asegura que las fotos de arriendos no sean accesibles públicamente.
--
-- IMPORTANTE: Ejecutar DESPUÉS de que todos los clientes se actualicen,
-- ya que las URLs públicas dejarán de funcionar.
--
-- Después de ejecutar, se debe regenerar las URLs de las fotos existentes
-- usando signed URLs en el código de la aplicación.

-- Cambiar bucket a privado
UPDATE storage.buckets
SET public = false
WHERE id = 'prestamos';

-- Las políticas RLS existentes ya usan usuario_activo(), así que
-- los usuarios autenticados y activos pueden seguir accediendo.
-- No es necesario crear nuevas políticas.

-- Opcional: Eliminar políticas antiguas de acceso público si existían
-- DROP POLICY IF EXISTS "Permitir lectura publica de fotos" ON storage.objects;
-- DROP POLICY IF EXISTS "Permitir subida publica de fotos" ON storage.objects;
