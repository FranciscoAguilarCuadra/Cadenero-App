# ROADMAP - CadeneroApp

## Estado del proyecto

**Versión actual:** v1.0.0 + login cerrado en desarrollo

---

# Objetivo

Desarrollar una aplicación web rápida y sencilla para gestionar arriendos de cadenas para nieve, usando fotografías como identificación principal del préstamo y permitiendo registrar cada arriendo en pocos segundos.

---

# Versión 1.0.0 (MVP)

## Proyecto base

* [x] Crear proyecto React
* [x] Configurar React Router
* [x] Datos de prueba locales como respaldo

## Dashboard

* [x] Mostrar préstamos activos
* [x] Tarjetas de préstamos
* [x] Botón flotante "Nuevo préstamo"
* [x] Estado vacío cuando no hay préstamos activos

## Registro de préstamo

* [x] Modal para crear préstamo
* [x] Fotografía del vehículo
* [x] Fotografía de la garantía
* [x] Selección de cantidad de días
* [x] Método de pago
* [x] Observaciones

## Gestión de préstamos

* [x] Editar préstamo
* [x] Marcar préstamo como devuelto
* [x] Enviar préstamo al historial

## Historial

* [x] Visualizar préstamos devueltos
* [x] Estado vacío cuando no hay préstamos devueltos

## Supabase

* [x] Configurar cliente Supabase
* [x] Guardar préstamos en base de datos
* [x] Subir fotografías a Storage
* [x] Script SQL de configuración inicial

## Optimización móvil

* [x] Diseño responsive
* [x] Botones grandes
* [x] Flujo optimizado para uso con una mano

---

# Login Cerrado

* [x] Pantalla de inicio de sesión
* [x] Sin registro público
* [x] Perfiles con rol y estado activo/inactivo
* [x] Bloqueo de usuarios no activos
* [x] Cerrar sesión desde la navegación
* [ ] Panel admin para crear/activar cuentas desde la app

---

# Pendiente Posterior

* [ ] Panel admin
* [ ] Buscar préstamos
* [ ] Filtros por estado
* [ ] Ordenamiento
* [ ] PWA instalable
* [ ] Notificaciones de devolución
* [ ] Estadísticas

---

# Ideas futuras

* QR para identificar préstamos
* Firma digital
* Integración con pagos
* WhatsApp automático
* Modo oscuro
