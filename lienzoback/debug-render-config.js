const fs = require('fs');
const path = require('path');

console.log('🔧 DEBUGGEO DE CONFIGURACIÓN DE RENDER');
console.log('======================================\n');

// Verificar archivos de configuración
const configFiles = [
  'package.json',
  'nest-cli.json',
  'tsconfig.json',
  'src/main.ts',
  'src/app.module.ts'
];

console.log('📁 Verificando archivos de configuración:');
configFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} - Existe`);
    
    if (file === 'package.json') {
      const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`      Scripts disponibles: ${Object.keys(pkg.scripts).join(', ')}`);
      console.log(`      Puerto por defecto: ${pkg.scripts.start || 'No definido'}`);
    }
  } else {
    console.log(`   ❌ ${file} - No existe`);
  }
});

// Verificar configuración de NestJS
console.log('\n🏗️  Verificando configuración de NestJS:');
try {
  const nestConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'nest-cli.json'), 'utf8'));
  console.log(`   Compilador: ${nestConfig.compiler?.type || 'default'}`);
  console.log(`   Source Root: ${nestConfig.sourceRoot || 'src'}`);
  console.log(`   Entry File: ${nestConfig.entryFile || 'main'}`);
} catch (error) {
  console.log(`   ❌ Error leyendo nest-cli.json: ${error.message}`);
}

// Verificar main.ts
console.log('\n📝 Verificando main.ts:');
try {
  const mainContent = fs.readFileSync(path.join(__dirname, 'src/main.ts'), 'utf8');
  const hasListen = mainContent.includes('app.listen');
  const hasPort = mainContent.includes('process.env.PORT');
  const hasHealth = mainContent.includes('/health');
  
  console.log(`   app.listen(): ${hasListen ? '✅' : '❌'}`);
  console.log(`   process.env.PORT: ${hasPort ? '✅' : '❌'}`);
  console.log(`   Endpoint /health: ${hasHealth ? '✅' : '❌'}`);
  
  if (hasListen) {
    const portMatch = mainContent.match(/app\.listen\([^)]*\)/);
    if (portMatch) {
      console.log(`   Puerto configurado: ${portMatch[0]}`);
    }
  }
} catch (error) {
  console.log(`   ❌ Error leyendo main.ts: ${error.message}`);
}

// Verificar package.json scripts
console.log('\n📦 Verificando scripts de package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const scripts = pkg.scripts || {};
  
  console.log('   Scripts disponibles:');
  Object.entries(scripts).forEach(([name, script]) => {
    console.log(`      ${name}: ${script}`);
  });
  
  // Verificar si hay script de start para producción
  if (scripts.start) {
    console.log(`   ✅ Script de start: ${scripts.start}`);
  } else {
    console.log('   ⚠️  No hay script de start definido');
  }
  
  if (scripts.build) {
    console.log(`   ✅ Script de build: ${scripts.build}`);
  } else {
    console.log('   ⚠️  No hay script de build definido');
  }
  
} catch (error) {
  console.log(`   ❌ Error leyendo package.json: ${error.message}`);
}

// Verificar estructura de directorios
console.log('\n📂 Verificando estructura de directorios:');
const dirs = ['src', 'dist', 'node_modules'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    const stats = fs.statSync(dirPath);
    console.log(`   ✅ ${dir}/ - ${stats.isDirectory() ? 'Directorio' : 'Archivo'}`);
    
    if (dir === 'dist') {
      const distFiles = fs.readdirSync(dirPath);
      console.log(`      Archivos en dist/: ${distFiles.slice(0, 5).join(', ')}${distFiles.length > 5 ? '...' : ''}`);
    }
  } else {
    console.log(`   ❌ ${dir}/ - No existe`);
  }
});

console.log('\n🔍 DIAGNÓSTICO:');
console.log('==============');
console.log('Si el servidor no responde después del deploy:');
console.log('1. Verificar que el script de start esté configurado correctamente');
console.log('2. Verificar que el puerto esté configurado (process.env.PORT)');
console.log('3. Verificar que no hay errores de compilación');
console.log('4. Verificar logs de Render para errores específicos');

console.log('\n🔧 CONFIGURACIÓN RECOMENDADA PARA RENDER:');
console.log('=========================================');
console.log('1. Build Command: npm run build');
console.log('2. Start Command: npm run start:prod (o node dist/main.js)');
console.log('3. Environment Variables:');
console.log('   - NODE_ENV=production');
console.log('   - PORT=10000 (o el puerto que Render asigne)');
console.log('   - Todas las variables de base de datos y Stripe');

console.log('\n📝 PARA VERIFICAR EN RENDER DASHBOARD:');
console.log('1. Ir a https://dashboard.render.com');
console.log('2. Seleccionar el servicio lienzoback');
console.log('3. Verificar en "Settings" > "Build & Deploy":');
console.log('   - Build Command');
console.log('   - Start Command');
console.log('4. Verificar en "Environment" las variables de entorno');
console.log('5. Revisar logs en "Logs" para errores específicos');
