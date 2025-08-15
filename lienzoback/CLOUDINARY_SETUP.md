# Configuración de Cloudinary en Render

## 🚨 Problema Actual
La subida de imágenes no funciona en Render porque las variables de entorno de Cloudinary no están configuradas.

## 🔧 Solución

### 1. Obtener Credenciales de Cloudinary
1. Ve a [Cloudinary](https://cloudinary.com/) y crea una cuenta gratuita
2. Una vez registrado, ve al Dashboard
3. Copia las siguientes credenciales:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. Configurar Variables en Render
1. Ve a tu proyecto en [Render](https://render.com/)
2. Ve a la sección "Environment"
3. Agrega las siguientes variables:

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 3. Variables de Entorno Requeridas
- `CLOUDINARY_CLOUD_NAME` - Nombre de tu cloud en Cloudinary
- `CLOUDINARY_API_KEY` - Tu API Key de Cloudinary
- `CLOUDINARY_API_SECRET` - Tu API Secret de Cloudinary

### 4. Reiniciar el Servicio
Después de configurar las variables:
1. Ve a la sección "Manual Deploy"
2. Haz clic en "Deploy latest commit"
3. Espera a que termine el despliegue

### 5. Verificar la Configuración
Una vez desplegado, puedes verificar la configuración con:
```bash
curl -X GET https://tu-app.onrender.com/file/test/cloudinary-config
```

## 🧪 Probar la Subida de Imágenes
Después de configurar las variables, prueba subir una imagen:

```bash
curl -X POST https://tu-app.onrender.com/products \
  -F "name=Producto Test" \
  -F "description=Descripción del producto" \
  -F "price=19.99" \
  -F "stock=10" \
  -F "caloricLevel=300" \
  -F "categoryId=tu-category-id" \
  -F "ingredients[]=ingrediente1" \
  -F "image=@ruta/a/tu/imagen.jpg"
```

## 📝 Notas Importantes
- Las credenciales de Cloudinary son sensibles, no las compartas
- El plan gratuito de Cloudinary tiene límites de uso
- Las imágenes se almacenan en la carpeta "products" en Cloudinary
- Las imágenes se optimizan automáticamente (máximo 800x600px)

## 🔍 Troubleshooting
Si sigues teniendo problemas:
1. Verifica que las variables estén escritas correctamente
2. Asegúrate de que no haya espacios extra
3. Reinicia el servicio después de cambiar las variables
4. Revisa los logs de Render para más detalles
