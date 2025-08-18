# 🍽️ Lienzo Culinario - Backend API

## 📋 Descripción

Backend API para el proyecto **Lienzo Culinario**, desarrollado como parte del programa Full Stack Developer de Henry. Esta API proporciona funcionalidades completas para una plataforma de delivery de comida.

## 🚀 Características Principales

- **👥 Gestión de Usuarios** - Registro, login y autenticación JWT
- **🛍️ Catálogo de Productos** - CRUD completo con imágenes y ingredientes
- **📂 Categorías** - Organización de productos por categorías
- **🛒 Carrito de Compras** - Gestión de carritos y checkout
- **📦 Órdenes** - Procesamiento y seguimiento de pedidos
- **⭐ Reseñas** - Sistema de calificaciones y comentarios
- **🎫 Códigos de Descuento** - Sistema de promociones
- **🥘 Ingredientes** - Gestión de ingredientes de productos
- **📁 Subida de Archivos** - Integración con Cloudinary para imágenes
- **🔐 Autenticación** - JWT y Auth0 integration

## 🛠️ Tecnologías Utilizadas

- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT + Auth0
- **Almacenamiento**: Cloudinary
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator
- **Testing**: Jest

## 📁 Estructura del Proyecto

```
src/
├── modules/
│   ├── auth/           # Autenticación y autorización
│   ├── users/          # Gestión de usuarios
│   ├── products/       # Catálogo de productos
│   ├── categories/     # Categorías de productos
│   ├── cart/           # Carrito de compras
│   ├── orders/         # Gestión de órdenes
│   ├── reviews/        # Sistema de reseñas
│   ├── discount-codes/ # Códigos de descuento
│   ├── ingredients/    # Gestión de ingredientes
│   └── file-upload/    # Subida de archivos
├── config/             # Configuraciones
├── common/             # Utilidades compartidas
└── types/              # Definiciones de tipos
```

## 🔗 Enlaces Útiles

- **📖 Documentación API**: [Swagger UI](http://localhost:3001/api)
- **🔧 Guía de Instalación**: [SETUP/installation.md](SETUP/installation.md)
- **📋 Endpoints**: [API/endpoints.md](API/endpoints.md)
- **🔐 Autenticación**: [API/authentication.md](API/authentication.md)
- **📁 Subida de Archivos**: [API/file-upload.md](API/file-upload.md)

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js (v18+)
- PostgreSQL
- Cuenta de Cloudinary (opcional)

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/lienzoculinariog2/nuevolienzoback-.git
cd nuevolienzoback-/lienzoback

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.development
# Editar .env.development con tus credenciales

# Ejecutar migraciones
npm run migration:run

# Iniciar servidor de desarrollo
npm run start:dev
```

### Acceso a la API
- **Servidor**: http://localhost:3001
- **Documentación**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 📊 Endpoints Principales

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| **Auth** | `POST /auth/login` | Autenticación de usuarios |
| **Users** | `GET/POST/PUT/DELETE /users` | Gestión de usuarios |
| **Products** | `GET/POST/PUT/DELETE /products` | Catálogo de productos |
| **Categories** | `GET/POST/PUT/DELETE /categories` | Categorías de productos |
| **Cart** | `GET/POST/PUT/DELETE /cart` | Carrito de compras |
| **Orders** | `GET/POST/PUT/DELETE /orders` | Gestión de órdenes |
| **Reviews** | `GET/POST/PUT/DELETE /reviews` | Sistema de reseñas |

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Para endpoints protegidos, incluye el token en el header:

```bash
Authorization: Bearer <tu-token-jwt>
```

## 📁 Subida de Archivos

La API soporta subida de imágenes a través de Cloudinary:

- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Tamaño máximo**: 5MB
- **Transformaciones**: Redimensionado automático a 800x600

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura de tests
npm run test:cov
```

## 🚀 Despliegue

### Variables de Entorno Requeridas

```env
# Base de Datos
DB_NAME=lienzoCulinario
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_jwt_secret

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Auth0 (opcional)
AUTH0_DOMAIN=tu_dominio.auth0.com
AUTH0_AUDIENCE=tu_audience
```

## 👥 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es parte del programa Full Stack Developer de Henry.

## 🤝 Equipo

- **Desarrolladores**: Equipo Lienzo Culinario G2
- **Mentor**: Henry Bootcamp
- **Proyecto**: Lienzo Culinario

---

**¿Necesitas ayuda?** Revisa la [documentación completa](API/) o abre un issue en el repositorio.
