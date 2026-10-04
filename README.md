# Cadenero App

> Aplicación web para gestionar arriendos de cadenas de nieve desde el teléfono celular.
> Nacida en terreno: la construí y usé mientras trabajaba como cadenero en **Las Trancas, Ñuble**, durante la temporada de invierno de 2026.

[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

**Demo en producción:** [cadenero-app-ecru.vercel.app](https://cadenero-app-ecru.vercel.app)

<!--
## Capturas
Coloca las imágenes en `docs/screenshots/` y descomenta:
![Dashboard](docs/screenshots/dashboard.png)
![Nuevo arriendo](docs/screenshots/nuevo-arriendo.png)
![Historial](docs/screenshots/historial.png)
-->

---

## El problema

Los cadeneros registraban los arriendos de cadenas manualmente: anotar el vehículo, la garantía, cobrar en efectivo o transferencia y controlar qué cadenas estaban fuera y cuáles volvieron. En una jornada concurrida con turistas, era fácil perder el control de quién debía qué.

## La solución

Una aplicación web optimizada para teléfono que centraliza el ciclo completo de un arriendo:

- **Login cerrado** para cadeneros autorizados.
- **Registro de arriendo o porte** con fotografías del vehículo y de la garantía.
- **Estados claros:** arriendos separados en activos / devueltos, con edición y reversión.
- **Historial** de arriendos devueltos para el cierre del día.
- **Sincronización en la nube** con Supabase (base de datos y almacenamiento de fotos).
- **Diseño mobile-first:** funciona cómoda con una mano, en la calle, con frío.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite |
| Backend / DB | Supabase (PostgreSQL + Storage + Auth) |
| Despliegue | Vercel |
| Calidad | ESLint, CHANGELOG, registro de decisiones técnicas |

## Estado del proyecto

- **Versión:** 1.0.0 — MVP formalizado y en producción.
- **Uso real:** desplegado y utilizado durante la temporada de invierno en Las Trancas.
- **Roadmap:** ver [ROADMAP.md](ROADMAP.md) y [TODO.md](TODO.md).
- **Decisiones de diseño:** ver [decisions.md](decisions.md).

## Versión móvil

La app cuenta además con versión móvil nativa (Expo / React Native) con **modo offline y cola de sincronización**: [cadenero-app-mobile](https://github.com/FranciscoAguilarCuadra/cadenero-app-mobile). Ambas comparten el mismo backend de Supabase.

## Correr el proyecto en local

```bash
# 1. Clonar e instalar
git clone https://github.com/FranciscoAguilarCuadra/Cadenero-App.git
cd Cadenero-App
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# 3. Levantar en desarrollo
npm run dev
```

Comandos disponibles: `npm run dev`, `npm run build`, `npm run lint`.

## Estructura

```
Cadenero-App/
├── src/          # Lógica de la aplicación (componentes, vistas, servicios)
├── supabase/     # Configuración del esquema en Supabase
├── public/       # Recursos estáticos
├── decisions.md  # Registro de decisiones técnicas
├── ROADMAP.md    # Planificación de versiones futuras
└── CHANGELOG.md  # Historial de cambios por versión
```

## Autor

**Francisco Aguilar Cuadra** — Ingeniero Civil Informático
[GitHub](https://github.com/FranciscoAguilarCuadra) · [LinkedIn](https://linkedin.com/in/francisco-aguilar-cuadra)
