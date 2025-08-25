const fs = require('fs');
const path = require('path');

console.log('🔧 DEBUGGEO DE STARTUP DEL SERVIDOR');
console.log('====================================\n');

// Verificar archivo main.js compilado
console.log('📁 Verificando archivo main.js compilado:');
const mainJsPath = path.join(__dirname, 'dist/main.js');

if (fs.existsSync(mainJsPath)) {
  console.log('   ✅ dist/main.js existe');
  
  const stats = fs.statSync(mainJsPath);
  console.log(`   📊 Tamaño: ${stats.size} bytes`);
  console.log(`   📅 Última modificación: ${stats.mtime.toLocaleString()}`);
  
  // Verificar contenido básico
  const content = fs.readFileSync(mainJsPath, 'utf8');
  const hasListen = content.includes('app.listen');
  const hasPort = content.includes('process.env.PORT');
  
  console.log(`   🔍 Contiene app.listen: ${hasListen ? '✅' : '❌'}`);
  console.log(`   🔍 Contiene process.env.PORT: ${hasPort ? '✅' : '❌'}`);
  
} else {
  console.log('   ❌ dist/main.js no existe');
  console.log('   💡 Posible problema: Build no se completó correctamente');
}

// Verificar estructura de dist/
console.log('\n📂 Verificando estructura de dist/:');
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath);
  console.log(`   📊 Archivos en dist/: ${distFiles.length}`);
  
  const importantFiles = ['main.js', 'main.d.ts', 'app.module.js'];
  importantFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} - Existe`);
    } else {
      console.log(`   ❌ ${file} - No existe`);
    }
  });
  
  // Mostrar algunos archivos
  console.log(`   📋 Archivos disponibles: ${distFiles.slice(0, 10).join(', ')}${distFiles.length > 10 ? '...' : ''}`);
} else {
  console.log('   ❌ Directorio dist/ no existe');
}

// Verificar package.json scripts
console.log('\n📦 Verificando scripts de package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const scripts = pkg.scripts || {};
  
  console.log(`   start: ${scripts.start || 'No definido'}`);
  console.log(`   start:prod: ${scripts['start:prod'] || 'No definido'}`);
  console.log(`   build: ${scripts.build || 'No definido'}`);
  
} catch (error) {
  console.log(`   ❌ Error leyendo package.json: ${error.message}`);
}

// Verificar variables de entorno necesarias
console.log('\n🔧 Verificando variables de entorno necesarias:');
require('dotenv').config({ path: '.env.development' });

const requiredEnvVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: Configurado`);
  } else {
    console.log(`   ❌ ${varName}: No configurado`);
  }
});

// Verificar configuración de TypeORM
console.log('\n🏗️  Verificando configuración de TypeORM:');
try {
  const typeormConfig = fs.readFileSync(path.join(__dirname, 'src/config/typeorm.ts'), 'utf8');
  
  const hasDatabaseUrl = typeormConfig.includes('DATABASE_URL');
  const hasHost = typeormConfig.includes('DB_HOST');
  const hasPort = typeormConfig.includes('DB_PORT');
  
  console.log(`   🔍 Usa DATABASE_URL: ${hasDatabaseUrl ? '✅' : '❌'}`);
  console.log(`   🔍 Usa DB_HOST: ${hasHost ? '✅' : '❌'}`);
  console.log(`   🔍 Usa DB_PORT: ${hasPort ? '✅' : '❌'}`);
  
} catch (error) {
  console.log(`   ❌ Error leyendo typeorm.ts: ${error.message}`);
}

console.log('\n📊 DIAGNÓSTICO:');
console.log('==============');
console.log('Si dist/main.js no existe:');
console.log('1. El build no se completó correctamente');
console.log('2. Verificar logs de build en Render');
console.log('3. Verificar que no hay errores de TypeScript');

console.log('\nSi dist/main.js existe pero el servidor no inicia:');
console.log('1. Problema con variables de entorno');
console.log('2. Error en la conexión a la base de datos');
console.log('3. Error en la configuración de TypeORM');

console.log('\n🔧 ACCIONES RECOMENDADAS:');
console.log('1. Verificar en Render Dashboard:');
console.log('   - Logs de build (Build & Deploy > Build Logs)');
console.log('   - Logs de runtime (Logs)');
console.log('   - Variables de entorno (Environment)');

console.log('\n2. Verificar configuración:');
console.log('   - Todas las variables de entorno estén configuradas');
console.log('   - DATABASE_URL sea válida');
console.log('   - STRIPE_SECRET_KEY sea válida');

console.log('\n3. Posibles soluciones:');
console.log('   - Revisar logs de build para errores de compilación');
console.log('   - Verificar conexión a la base de datos');
console.log('   - Corregir variables de entorno faltantes');
