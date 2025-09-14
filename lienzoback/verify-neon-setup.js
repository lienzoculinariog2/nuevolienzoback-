#!/usr/bin/env node

/**
 * ✅ Script de verificación final para Neon
 * 
 * Este script verifica que todo esté configurado correctamente
 * para usar Neon Database
 * 
 * Uso:
 * node verify-neon-setup.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function verifyNeonSetup() {
  console.log('✅ ===== VERIFICACIÓN FINAL DE NEON SETUP =====');
  console.log('');
  
  let allChecksPassed = true;
  
  // 1. Verificar variables de entorno
  console.log('1️⃣ Verificando variables de entorno...');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  const optionalVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'MAIL_HOST',
    'MAIL_USER',
    'AUTH0_DOMAIN'
  ];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName} configurada`);
    } else {
      console.log(`   ❌ ${varName} NO configurada`);
      allChecksPassed = false;
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName} configurada (opcional)`);
    } else {
      console.log(`   ⚠️ ${varName} no configurada (opcional)`);
    }
  }
  
  console.log('');
  
  // 2. Verificar conexión a Neon
  console.log('2️⃣ Verificando conexión a Neon...');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('   ❌ DATABASE_URL no configurada');
    allChecksPassed = false;
  } else {
    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await client.connect();
      console.log('   ✅ Conexión a Neon exitosa');
      
      // Verificar tablas
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log(`   ✅ ${tablesResult.rows.length} tablas encontradas`);
        
        const expectedTables = [
          'users', 'products', 'categories', 'orders', 'order_details',
          'cart', 'cart_items', 'payments', 'reviews', 'ingredients',
          'discount_codes', 'discount_codes_used'
        ];
        
        const foundTables = tablesResult.rows.map(row => row.table_name);
        const missingTables = expectedTables.filter(table => !foundTables.includes(table));
        
        if (missingTables.length === 0) {
          console.log('   ✅ Todas las tablas esperadas están presentes');
        } else {
          console.log(`   ⚠️ Faltan tablas: ${missingTables.join(', ')}`);
          console.log('   💡 Ejecuta: npm run migration:run');
        }
      } else {
        console.log('   ⚠️ No hay tablas en la base de datos');
        console.log('   💡 Ejecuta: npm run migration:run');
      }
      
      // Verificar migraciones
      try {
        const migrationsResult = await client.query(`
          SELECT COUNT(*) as count FROM migrations
        `);
        console.log(`   ✅ ${migrationsResult.rows[0].count} migraciones ejecutadas`);
      } catch (error) {
        console.log('   ⚠️ Tabla de migraciones no encontrada');
      }
      
      await client.end();
      
    } catch (error) {
      console.log(`   ❌ Error conectando a Neon: ${error.message}`);
      allChecksPassed = false;
    }
  }
  
  console.log('');
  
  // 3. Verificar configuración de TypeORM
  console.log('3️⃣ Verificando configuración de TypeORM...');
  
  if (process.env.TYPEORM_SYNC === 'false' || process.env.TYPEORM_SYNC === undefined) {
    console.log('   ✅ TYPEORM_SYNC configurado correctamente (false)');
  } else {
    console.log('   ⚠️ TYPEORM_SYNC debería ser false en producción');
  }
  
  if (process.env.TYPEORM_DROP === 'false' || process.env.TYPEORM_DROP === undefined) {
    console.log('   ✅ TYPEORM_DROP configurado correctamente (false)');
  } else {
    console.log('   ⚠️ TYPEORM_DROP debería ser false en producción');
  }
  
  console.log('');
  
  // 4. Verificar archivos de configuración
  console.log('4️⃣ Verificando archivos de configuración...');
  
  const fs = require('fs');
  const path = require('path');
  
  const configFiles = [
    'src/config/typeorm.ts',
    'src/config/cors.config.ts',
    'src/config/cloudinary.ts'
  ];
  
  for (const file of configFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`   ✅ ${file} existe`);
    } else {
      console.log(`   ❌ ${file} no encontrado`);
      allChecksPassed = false;
    }
  }
  
  console.log('');
  
  // 5. Verificar scripts de package.json
  console.log('5️⃣ Verificando scripts de package.json...');
  
  const packageJson = require('./package.json');
  const requiredScripts = [
    'test:neon',
    'migrate:neon',
    'update:render',
    'migration:run'
  ];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
      console.log(`   ✅ Script ${script} disponible`);
    } else {
      console.log(`   ❌ Script ${script} no encontrado`);
      allChecksPassed = false;
    }
  }
  
  console.log('');
  
  // Resumen final
  console.log('📋 ===== RESUMEN =====');
  console.log('');
  
  if (allChecksPassed) {
    console.log('🎉 ¡Todas las verificaciones pasaron!');
    console.log('');
    console.log('✅ Tu aplicación está lista para usar Neon Database');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('   1. Ejecuta: npm run start:dev');
    console.log('   2. Prueba la aplicación localmente');
    console.log('   3. Actualiza las variables en Render');
    console.log('   4. Redespliega en Render');
    console.log('');
  } else {
    console.log('⚠️ Algunas verificaciones fallaron');
    console.log('');
    console.log('💡 Revisa los errores arriba y corrige los problemas');
    console.log('');
    console.log('📋 Comandos útiles:');
    console.log('   npm run test:neon          # Probar conexión');
    console.log('   npm run migration:run      # Ejecutar migraciones');
    console.log('   npm run migrate:neon       # Migración asistida');
    console.log('   npm run update:render      # Guía para Render');
    console.log('');
  }
  
  console.log('🔗 Enlaces útiles:');
  console.log('   📖 Documentación Neon: https://neon.tech/docs');
  console.log('   🚀 Dashboard Neon: https://console.neon.tech');
  console.log('   📊 Render Dashboard: https://dashboard.render.com');
  console.log('');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifyNeonSetup().catch(console.error);
}

module.exports = { verifyNeonSetup };
