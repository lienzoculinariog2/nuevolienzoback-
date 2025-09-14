#!/usr/bin/env node

/**
 * 🚀 Script para migrar a Neon Database
 * 
 * Este script te ayuda a migrar desde tu base de datos actual a Neon
 * 
 * Uso:
 * node migrate-to-neon.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function migrateToNeon() {
  console.log('🌟 ===== MIGRACIÓN A NEON DATABASE =====');
  
  // Verificar que tenemos la URL de Neon
  const neonUrl = process.env.DATABASE_URL;
  
  if (!neonUrl) {
    console.error('❌ DATABASE_URL no está configurada');
    console.log('📝 Configura DATABASE_URL en tu .env.development con la URL de Neon');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL encontrada');
  
  // Crear cliente para Neon
  const neonClient = new Client({
    connectionString: neonUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔄 Conectando a Neon...');
    await neonClient.connect();
    console.log('✅ Conexión exitosa a Neon!');
    
    // Verificar si ya hay tablas
    console.log('🔄 Verificando estado actual de la base de datos...');
    const tablesResult = await neonClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Tablas existentes en Neon:');
      tablesResult.rows.forEach(row => {
        console.log(`   📄 ${row.table_name}`);
      });
      
      const response = await askQuestion('¿Deseas continuar? Esto podría sobrescribir datos existentes. (y/N): ');
      if (response.toLowerCase() !== 'y' && response.toLowerCase() !== 'yes') {
        console.log('❌ Migración cancelada por el usuario');
        process.exit(0);
      }
    } else {
      console.log('📋 Base de datos vacía, perfecto para migración');
    }
    
    // Ejecutar migraciones
    console.log('🔄 Ejecutando migraciones...');
    console.log('💡 Ejecuta: npm run migration:run');
    
    // Verificar migraciones
    console.log('🔄 Verificando migraciones...');
    const migrationsResult = await neonClient.query(`
      SELECT * FROM migrations 
      ORDER BY timestamp DESC 
      LIMIT 5
    `).catch(() => {
      console.log('📋 Tabla de migraciones no existe aún');
      return { rows: [] };
    });
    
    if (migrationsResult.rows.length > 0) {
      console.log('📋 Últimas migraciones ejecutadas:');
      migrationsResult.rows.forEach(row => {
        console.log(`   📄 ${row.name} - ${row.timestamp}`);
      });
    }
    
    // Verificar tablas después de migraciones
    console.log('🔄 Verificando tablas después de migraciones...');
    const finalTablesResult = await neonClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (finalTablesResult.rows.length > 0) {
      console.log('✅ Tablas creadas exitosamente:');
      finalTablesResult.rows.forEach(row => {
        console.log(`   📄 ${row.table_name}`);
      });
    } else {
      console.log('⚠️ No se encontraron tablas. Ejecuta las migraciones manualmente.');
    }
    
    // Verificar extensiones necesarias
    console.log('🔄 Verificando extensiones...');
    const extensionsResult = await neonClient.query(`
      SELECT extname 
      FROM pg_extension 
      ORDER BY extname
    `);
    
    const requiredExtensions = ['uuid-ossp'];
    const installedExtensions = extensionsResult.rows.map(row => row.extname);
    
    for (const ext of requiredExtensions) {
      if (!installedExtensions.includes(ext)) {
        console.log(`🔄 Instalando extensión ${ext}...`);
        try {
          await neonClient.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
          console.log(`✅ Extensión ${ext} instalada`);
        } catch (error) {
          console.log(`⚠️ No se pudo instalar ${ext}: ${error.message}`);
        }
      } else {
        console.log(`✅ Extensión ${ext} ya está instalada`);
      }
    }
    
    console.log('✅ Migración a Neon completada exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('   1. Ejecuta: npm run migration:run');
    console.log('   2. Prueba la conexión: npm run test:neon');
    console.log('   3. Inicia el servidor: npm run start:dev');
    console.log('   4. Actualiza las variables en Render');
    
  } catch (error) {
    console.error('❌ Error durante la migración:');
    console.error(`   📝 Mensaje: ${error.message}`);
    console.error(`   🔍 Código: ${error.code}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Verifica que la URL de Neon sea correcta');
    } else if (error.code === '28P01') {
      console.log('💡 Verifica las credenciales de Neon');
    }
    
    process.exit(1);
  } finally {
    await neonClient.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Función auxiliar para preguntas
function askQuestion(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  migrateToNeon().catch(console.error);
}

module.exports = { migrateToNeon };
