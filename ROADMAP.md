# ROADMAP - Cadenero App

## Estado del proyecto

**Version actual:** v1.0.0  
**Estado:** MVP formalizado

---

## Objetivo

Desarrollar una aplicacion web rapida y sencilla para gestionar arriendos de cadenas para nieve, usando fotografias como identificacion principal del arriendo y permitiendo registrar cada movimiento en pocos segundos desde telefono celular.

---

## Version 1.0.0 - MVP

### Proyecto base

- [x] Crear proyecto React
- [x] Configurar React Router
- [x] Configurar Vite
- [x] Configurar ESLint
- [x] Datos de prueba locales como respaldo

### Login cerrado

- [x] Pantalla de inicio de sesion
- [x] Sin registro publico
- [x] Perfiles con rol y estado activo/inactivo
- [x] Bloqueo de usuarios no activos
- [x] Cerrar sesion desde la navegacion

### Dashboard

- [x] Mostrar arriendos activos
- [x] Separar arriendos por usuario
- [x] Tarjetas de arriendo
- [x] Boton flotante para nuevo arriendo
- [x] Estado vacio cuando no hay arriendos activos
- [x] Agrupacion por fecha solo cuando existen arriendos

### Registro de arriendo

- [x] Modal para crear arriendo
- [x] Seleccionar arriendo o porte
- [x] Fotografia de garantia
- [x] Multiples fotografias del vehiculo
- [x] Metodo de pago
- [x] Observaciones
- [x] Edicion de arriendos activos

### Gestion de arriendos

- [x] Marcar arriendo como devuelto
- [x] Revertir arriendo devuelto a activo
- [x] Eliminar arriendo con confirmacion
- [x] Visualizar fotografias en galeria

### Historial

- [x] Visualizar arriendos devueltos
- [x] Revertir devueltos a activos
- [x] Eliminar desde historial con confirmacion
- [x] Estado vacio cuando no hay arriendos devueltos

### Supabase

- [x] Configurar cliente Supabase
- [x] Guardar arriendos en base de datos
- [x] Subir fotografias a Storage
- [x] Script SQL de configuracion inicial

### Optimizacion movil

- [x] Diseno responsive
- [x] Botones grandes
- [x] Flujo optimizado para telefono
- [x] Ajustes de tarjetas, estados y acciones para pantallas pequenas

---

## Post 1.0.0

- [ ] Panel admin para crear, activar o desactivar cuentas desde la app
- [ ] Busqueda de arriendos
- [ ] Filtros por estado, fecha o tipo
- [ ] Estadisticas por cadenero
- [ ] PWA instalable
- [ ] Notificaciones o recordatorios
- [ ] Mejoras de compresion/gestion de fotografias si aumenta el uso

---

## Ideas futuras

- QR para identificar arriendos
- Firma digital
- Integracion con pagos
- Envio automatico por WhatsApp
- Modo oscuro
