const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando build para Render...');

// Verificar que el directorio dist existe
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Directorio dist no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

// Verificar que main.js existe
const mainPath = path.join(distPath, 'main.js');
if (!fs.existsSync(mainPath)) {
  console.error('❌ dist/main.js no existe. El build falló.');
  process.exit(1);
}

console.log('✅ dist/main.js encontrado');

// Verificar que app.module.js existe
const appModulePath = path.join(distPath, 'app.module.js');
if (!fs.existsSync(appModulePath)) {
  console.error('❌ dist/app.module.js no existe.');
  process.exit(1);
}

console.log('✅ dist/app.module.js encontrado');

// Verificar que las plantillas están copiadas
const templatesPath = path.join(distPath, 'modules/notifications/templates');
if (!fs.existsSync(templatesPath)) {
  console.log('⚠️ Plantillas no encontradas. Ejecutando copy:templates...');
  try {
    require('./copy-templates.js');
  } catch (error) {
    console.error('❌ Error copiando plantillas:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Plantillas encontradas');
}

// Verificar que el package.json tiene los scripts correctos
const packagePath = path.join(__dirname, 'package.json');
const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const startScript = packageContent.scripts.start;
const startProdScript = packageContent.scripts['start:prod'];

if (!startScript.includes('node dist/main')) {
  console.error('❌ Script "start" no apunta a dist/main');
  process.exit(1);
}

if (!startProdScript.includes('node dist/main')) {
  console.error('❌ Script "start:prod" no apunta a dist/main');
  process.exit(1);
}

console.log('✅ Scripts de package.json correctos');

console.log('🎉 Build verificado correctamente para Render!');
console.log('');
console.log('📋 Resumen:');
console.log('- ✅ dist/main.js existe');
console.log('- ✅ dist/app.module.js existe');
console.log('- ✅ Plantillas copiadas');
console.log('- ✅ Scripts configurados correctamente');
console.log('');
console.log('🚀 Listo para deploy en Render!');

