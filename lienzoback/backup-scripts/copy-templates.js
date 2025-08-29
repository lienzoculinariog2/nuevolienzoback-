const fs = require('fs');
const path = require('path');

console.log('📁 Copiando plantillas de email...');

const sourceDir = path.join(__dirname, 'src/modules/notifications/templates');
const targetDir = path.join(__dirname, 'dist/modules/notifications/templates');

try {
  // Verificar si el directorio fuente existe
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Directorio fuente no existe: ${sourceDir}`);
    process.exit(1);
  }

  // Crear directorio destino si no existe
  if (!fs.existsSync(targetDir)) {
    console.log(`📁 Creando directorio: ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Leer archivos del directorio fuente
  const files = fs.readdirSync(sourceDir);
  console.log(`📋 Archivos encontrados: ${files.length}`);

  // Copiar cada archivo
  files.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);
    
    if (fs.statSync(sourceFile).isFile()) {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`✅ Copiado: ${file}`);
    }
  });

  console.log('🎉 Plantillas copiadas exitosamente');
} catch (error) {
  console.error('❌ Error copiando plantillas:', error.message);
  process.exit(1);
}
