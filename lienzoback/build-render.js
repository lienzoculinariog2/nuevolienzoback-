#!/usr/bin/env node

/**
 * 🚀 Script de Build para Render
 * 
 * Este script maneja el build de manera más robusta para Render
 * 
 * Uso:
 * node build-render.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ===== BUILD PARA RENDER =====');

try {
  // 1. Verificar que estamos en el directorio correcto
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json no encontrado. Asegúrate de estar en el directorio raíz del proyecto.');
  }

  console.log('✅ package.json encontrado');

  // 2. Verificar que las dependencias estén instaladas
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Instalando dependencias...');
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('✅ node_modules encontrado');
  }

  // 3. Verificar que @nestjs/cli esté disponible
  try {
    execSync('npx nest --version', { stdio: 'pipe' });
    console.log('✅ NestJS CLI disponible');
  } catch (error) {
    console.log('⚠️ NestJS CLI no disponible, instalando...');
    execSync('npm install @nestjs/cli', { stdio: 'inherit' });
  }

  // 4. Ejecutar build
  console.log('🔨 Ejecutando build...');
  execSync('npx nest build', { stdio: 'inherit' });

  // 5. Verificar que el build fue exitoso
  if (!fs.existsSync('dist/main.js')) {
    throw new Error('Build falló: dist/main.js no encontrado');
  }

  console.log('✅ Build exitoso: dist/main.js creado');

  // 6. Copiar templates si es necesario
  if (fs.existsSync('copy-templates.js')) {
    console.log('📄 Copiando templates...');
    execSync('node copy-templates.js', { stdio: 'inherit' });
    console.log('✅ Templates copiados');
  }

  // 7. Verificar archivos críticos
  const criticalFiles = [
    'dist/main.js',
    'dist/app.module.js'
  ];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Archivo crítico no encontrado: ${file}`);
    }
  }

  console.log('✅ Todos los archivos críticos están presentes');
  console.log('🎉 Build completado exitosamente!');

} catch (error) {
  console.error('❌ Error durante el build:');
  console.error(`   📝 Mensaje: ${error.message}`);
  process.exit(1);
}
