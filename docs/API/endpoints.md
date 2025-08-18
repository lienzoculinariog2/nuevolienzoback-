# 📋 Documentación Completa de Endpoints - Lienzo Culinario API

## 🔗 Base URL

```
http://localhost:3001
```

## 🔐 Autenticación

La mayoría de endpoints requieren autenticación JWT. Incluye el token en el header:

```bash
Authorization: Bearer <tu-token-jwt>
```

## 📊 Resumen de Endpoints

| Módulo | Endpoints | Método | Descripción |
|--------|-----------|--------|-------------|
| **Auth** | `/auth/login` | POST | Autenticación de usuarios |
| **Auth** | `/auth/profile` | GET | Obtener perfil del usuario |
| **Users** | `/users` | GET | Listar todos los usuarios |
| **Users** | `/users` | POST | Crear nuevo usuario |
| **Users** | `/users/:id` | GET | Obtener usuario por ID |
| **Users** | `/users/:id` | PUT | Actualizar usuario |
| **Users** | `/users/:id` | DELETE | Eliminar usuario |
| **Products** | `/products` | GET | Listar productos con filtros |
| **Products** | `/products` | POST | Crear nuevo producto |
| **Products** | `/products/:id` | GET | Obtener producto por ID |
| **Products** | `/products/:id` | PUT | Actualizar producto |
| **Products** | `/products/:id` | DELETE | Eliminar producto |
| **Products** | `/products/activate/:id` | PUT | Activar producto |
| **Categories** | `/categories` | GET | Listar categorías |
| **Categories** | `/categories` | POST | Crear categoría |
| **Categories** | `/categories/:id` | GET | Obtener categoría por ID |
| **Categories** | `/categories/:id` | PUT | Actualizar categoría |
| **Categories** | `/categories/:id` | DELETE | Eliminar categoría |
| **Cart** | `/cart` | GET | Obtener carrito del usuario |
| **Cart** | `/cart/add` | POST | Agregar producto al carrito |
| **Cart** | `/cart/update` | PUT | Actualizar carrito |
| **Cart** | `/cart/remove/:productId` | DELETE | Remover producto del carrito |
| **Cart** | `/cart/clear` | DELETE | Vaciar carrito |
| **Orders** | `/orders` | GET | Listar órdenes del usuario |
| **Orders** | `/orders` | POST | Crear nueva orden |
| **Orders** | `/orders/:id` | GET | Obtener orden por ID |
| **Orders** | `/orders/:id` | PUT | Actualizar orden |
| **Reviews** | `/reviews` | GET | Listar reseñas |
| **Reviews** | `/reviews` | POST | Crear reseña |
| **Reviews** | `/reviews/:id` | GET | Obtener reseña por ID |
| **Reviews** | `/reviews/:id` | PUT | Actualizar reseña |
| **Reviews** | `/reviews/:id` | DELETE | Eliminar reseña |
| **Reviews** | `/reviews/product/:productId` | GET | Reseñas de un producto |
| **Discount Codes** | `/discount-codes` | GET | Listar códigos de descuento |
| **Discount Codes** | `/discount-codes` | POST | Crear código de descuento |
| **Discount Codes** | `/discount-codes/:id` | GET | Obtener código por ID |
| **Discount Codes** | `/discount-codes/:id` | PUT | Actualizar código |
| **Discount Codes** | `/discount-codes/:id` | DELETE | Eliminar código |
| **Ingredients** | `/ingredients` | GET | Listar ingredientes |
| **Ingredients** | `/ingredients` | POST | Crear ingrediente |
| **Ingredients** | `/ingredients/:id` | GET | Obtener ingrediente por ID |
| **Ingredients** | `/ingredients/:id` | PUT | Actualizar ingrediente |
| **Ingredients** | `/ingredients/:id` | DELETE | Eliminar ingrediente |
| **File Upload** | `/file/upload` | POST | Subir archivo |
| **File Upload** | `/file/test/health` | GET | Health check |
| **File Upload** | `/file/test/cloudinary-config` | GET | Verificar configuración Cloudinary |

---

## 🔐 Módulo de Autenticación

### POST /auth/login

**Descripción**: Autenticar usuario y obtener token JWT

**Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Usuario Ejemplo",
    "email": "usuario@ejemplo.com",
    "role": "user"
  }
}
```

### GET /auth/profile

**Descripción**: Obtener perfil del usuario autenticado

**Headers**: `Authorization: Bearer <token>`

**Response (200)**:
```json
{
  "id": "uuid",
  "name": "Usuario Ejemplo",
  "email": "usuario@ejemplo.com",
  "role": "user",
  "createdAt": "2025-08-18T13:14:14.000Z"
}
```

---

## 👥 Módulo de Usuarios

### GET /users

**Descripción**: Listar todos los usuarios

**Query Parameters**:
- `page` (number): Número de página
- `limit` (number): Elementos por página
- `search` (string): Buscar por nombre o email

**Response (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Usuario Ejemplo",
      "email": "usuario@ejemplo.com",
      "role": "user",
      "createdAt": "2025-08-18T13:14:14.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### POST /users

**Descripción**: Crear nuevo usuario

**Body**:
```json
{
  "name": "Nuevo Usuario",
  "email": "nuevo@ejemplo.com",
  "password": "password123",
  "role": "user"
}
```

**Response (201)**:
```json
{
  "id": "uuid",
  "name": "Nuevo Usuario",
  "email": "nuevo@ejemplo.com",
  "role": "user",
  "createdAt": "2025-08-18T13:14:14.000Z"
}
```

### GET /users/:id

**Descripción**: Obtener usuario por ID

**Response (200)**:
```json
{
  "id": "uuid",
  "name": "Usuario Ejemplo",
  "email": "usuario@ejemplo.com",
  "role": "user",
  "createdAt": "2025-08-18T13:14:14.000Z"
}
```

### PUT /users/:id

**Descripción**: Actualizar usuario

**Body**:
```json
{
  "name": "Usuario Actualizado",
  "email": "actualizado@ejemplo.com"
}
```

### DELETE /users/:id

**Descripción**: Eliminar usuario

**Response (200)**: Usuario eliminado exitosamente

---

## 🛍️ Módulo de Productos

### GET /products

**Descripción**: Listar productos con filtros

**Query Parameters**:
- `page` (number): Número de página
- `limit` (number): Elementos por página
- `search` (string): Buscar por nombre
- `category` (string): Filtrar por categoría
- `ingredient` (string): Filtrar por ingrediente
- `minPrice` (number): Precio mínimo
- `maxPrice` (number): Precio máximo
- `sortBy` (string): Campo para ordenar
- `order` (string): ASC o DESC

**Response (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Pizza Margarita",
      "description": "Pizza clásica italiana",
      "price": 29.99,
      "stock": 10,
      "caloricLevel": 250,
      "imgUrl": "https://res.cloudinary.com/...",
      "isActive": true,
      "category": {
        "id": "uuid",
        "name": "Pizzas"
      },
      "ingredients": [
        {
          "id": "uuid",
          "name": "Mozzarella"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### POST /products

**Descripción**: Crear nuevo producto

**Body** (multipart/form-data):
```json
{
  "name": "Nuevo Producto",
  "description": "Descripción del producto",
  "price": 29.99,
  "stock": 10,
  "caloricLevel": 250,
  "categoryId": "uuid",
  "ingredients": ["ingrediente1", "ingrediente2"],
  "image": "file"
}
```

**Response (201)**:
```json
{
  "id": "uuid",
  "name": "Nuevo Producto",
  "description": "Descripción del producto",
  "price": 29.99,
  "stock": 10,
  "caloricLevel": 250,
  "imgUrl": "https://res.cloudinary.com/...",
  "isActive": true,
  "category": {
    "id": "uuid",
    "name": "Categoría"
  },
  "ingredients": [
    {
      "id": "uuid",
      "name": "ingrediente1"
    }
  ]
}
```

### GET /products/:id

**Descripción**: Obtener producto por ID

**Response (200)**:
```json
{
  "id": "uuid",
  "name": "Pizza Margarita",
  "description": "Pizza clásica italiana",
  "price": 29.99,
  "stock": 10,
  "caloricLevel": 250,
  "imgUrl": "https://res.cloudinary.com/...",
  "isActive": true,
  "category": {
    "id": "uuid",
    "name": "Pizzas"
  },
  "ingredients": [
    {
      "id": "uuid",
      "name": "Mozzarella"
    }
  ],
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excelente pizza"
    }
  ]
}
```

### PUT /products/:id

**Descripción**: Actualizar producto

**Body** (multipart/form-data):
```json
{
  "name": "Producto Actualizado",
  "description": "Nueva descripción",
  "price": 34.99,
  "stock": 15,
  "caloricLevel": 280,
  "categoryId": "uuid",
  "ingredients": ["nuevo_ingrediente"],
  "image": "file"
}
```

### PUT /products/activate/:id

**Descripción**: Activar producto

**Response (200)**:
```json
{
  "message": "Producto activado exitosamente",
  "product": {
    "id": "uuid",
    "isActive": true
  }
}
```

### DELETE /products/:id

**Descripción**: Eliminar producto

**Response (200)**: Producto eliminado exitosamente

---

## 📂 Módulo de Categorías

### GET /categories

**Descripción**: Listar todas las categorías

**Response (200)**:
```json
[
  {
    "id": "uuid",
    "name": "Pizzas",
    "description": "Pizzas italianas",
    "imgUrl": "https://res.cloudinary.com/..."
  }
]
```

### POST /categories

**Descripción**: Crear nueva categoría

**Body**:
```json
{
  "name": "Nueva Categoría",
  "description": "Descripción de la categoría"
}
```

### GET /categories/:id

**Descripción**: Obtener categoría por ID

### PUT /categories/:id

**Descripción**: Actualizar categoría

### DELETE /categories/:id

**Descripción**: Eliminar categoría

---

## 🛒 Módulo de Carrito

### GET /cart

**Descripción**: Obtener carrito del usuario autenticado

**Headers**: `Authorization: Bearer <token>`

**Response (200)**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 2,
      "price": 29.99,
      "product": {
        "name": "Pizza Margarita",
        "imgUrl": "https://res.cloudinary.com/..."
      }
    }
  ],
  "total": 59.98
}
```

### POST /cart/add

**Descripción**: Agregar producto al carrito

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

### PUT /cart/update

**Descripción**: Actualizar carrito

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 3
    }
  ]
}
```

### DELETE /cart/remove/:productId

**Descripción**: Remover producto del carrito

**Headers**: `Authorization: Bearer <token>`

### DELETE /cart/clear

**Descripción**: Vaciar carrito

**Headers**: `Authorization: Bearer <token>`

---

## 📦 Módulo de Órdenes

### GET /orders

**Descripción**: Listar órdenes del usuario autenticado

**Headers**: `Authorization: Bearer <token>`

**Response (200)**:
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "total": 59.98,
    "status": "pending",
    "items": [
      {
        "productId": "uuid",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "createdAt": "2025-08-18T13:14:14.000Z"
  }
]
```

### POST /orders

**Descripción**: Crear nueva orden

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "total": 59.98,
  "status": "pending"
}
```

### GET /orders/:id

**Descripción**: Obtener orden por ID

**Headers**: `Authorization: Bearer <token>`

### PUT /orders/:id

**Descripción**: Actualizar orden

**Headers**: `Authorization: Bearer <token>`

---

## ⭐ Módulo de Reseñas

### GET /reviews

**Descripción**: Listar reseñas

**Query Parameters**:
- `productId` (string): Filtrar por producto
- `rating` (number): Filtrar por calificación

### POST /reviews

**Descripción**: Crear reseña

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "productId": "uuid",
  "rating": 5,
  "comment": "Excelente producto"
}
```

### GET /reviews/product/:productId

**Descripción**: Obtener reseñas de un producto específico

### PUT /reviews/:id

**Descripción**: Actualizar reseña

**Headers**: `Authorization: Bearer <token>`

### DELETE /reviews/:id

**Descripción**: Eliminar reseña

**Headers**: `Authorization: Bearer <token>`

---

## 🎫 Módulo de Códigos de Descuento

### GET /discount-codes

**Descripción**: Listar códigos de descuento

### POST /discount-codes

**Descripción**: Crear código de descuento

**Body**:
```json
{
  "code": "DESCUENTO20",
  "discountPercentage": 20,
  "maxUses": 100,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

### GET /discount-codes/:id

**Descripción**: Obtener código por ID

### PUT /discount-codes/:id

**Descripción**: Actualizar código

### DELETE /discount-codes/:id

**Descripción**: Eliminar código

---

## 🥘 Módulo de Ingredientes

### GET /ingredients

**Descripción**: Listar ingredientes

### POST /ingredients

**Descripción**: Crear ingrediente

**Body**:
```json
{
  "name": "Nuevo Ingrediente",
  "description": "Descripción del ingrediente"
}
```

### GET /ingredients/:id

**Descripción**: Obtener ingrediente por ID

### PUT /ingredients/:id

**Descripción**: Actualizar ingrediente

### DELETE /ingredients/:id

**Descripción**: Eliminar ingrediente

---

## 📁 Módulo de Subida de Archivos

### POST /file/upload

**Descripción**: Subir archivo a Cloudinary

**Body** (multipart/form-data):
```
file: archivo
```

**Response (200)**:
```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "products/abc123"
}
```

### GET /file/test/health

**Descripción**: Health check del módulo de archivos

**Response (200)**:
```json
{
  "status": "ok",
  "message": "File upload module is working"
}
```

### GET /file/test/cloudinary-config

**Descripción**: Verificar configuración de Cloudinary

**Response (200)**:
```json
{
  "cloudinaryConfigured": true,
  "cloudName": "tu_cloud_name",
  "apiKey": "configurado",
  "apiSecret": "configurado"
}
```

---

## 🔍 Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o faltante |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso ya existe |
| 422 | Unprocessable Entity - Validación fallida |
| 500 | Internal Server Error - Error del servidor |

## 📝 Ejemplos de Uso

### Ejemplo: Crear producto con imagen

```bash
curl -X POST http://localhost:3001/products \
  -H "Authorization: Bearer <token>" \
  -F "name=Pizza Margarita" \
  -F "description=Pizza clásica italiana" \
  -F "price=29.99" \
  -F "stock=10" \
  -F "caloricLevel=250" \
  -F "categoryId=uuid" \
  -F "ingredients[]=Mozzarella" \
  -F "ingredients[]=Tomate" \
  -F "image=@pizza.jpg"
```

### Ejemplo: Buscar productos por ingrediente

```bash
curl "http://localhost:3001/products?ingredient=Mozzarella&page=1&limit=10"
```

### Ejemplo: Agregar producto al carrito

```bash
curl -X POST http://localhost:3001/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "uuid",
    "quantity": 2
  }'
```
