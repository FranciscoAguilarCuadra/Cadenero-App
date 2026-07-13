# Cadenero App

Aplicacion web para gestionar arriendos de cadenas de nieve desde telefono celular.

La version `1.0.0` corresponde al MVP estable del proyecto: permite iniciar sesion, registrar arriendos con fotografias, separar arriendos activos/devueltos, revisar historial y mantener los datos sincronizados con Supabase.

## Funcionalidades principales

- Login cerrado para cadeneros autorizados.
- Arriendos independientes por usuario.
- Registro de arriendo o porte.
- Fotografias del vehiculo y garantia.
- Edicion de arriendos activos.
- Marcado de arriendo como devuelto.
- Reversion de devuelto a activo.
- Historial de arriendos devueltos.
- Eliminacion con confirmacion.
- Diseno optimizado para uso movil.
- Integracion con Supabase Database y Storage.

## Requisitos

- Node.js
- Proyecto Supabase configurado
- Variables de entorno locales

## Variables de entorno

Crear un archivo `.env` a partir de `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Version

Version actual: `1.0.0`

Estado: MVP formalizado.
