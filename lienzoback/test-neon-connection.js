#!/usr/bin/env node

/**
 * 🧪 Script para probar conexión con Neon Database
 * 
 * Uso:
 * node test-neon-connection.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function testNeonConnection() {
  console.log('🌟 ===== PROBANDO CONEXIÓN CON NEON =====');
  
  // Verificar variables de entorno
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está configurada');
    console.log('📝 Asegúrate de tener DATABASE_URL en tu .env.development');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL encontrada');
  console.log(`🔗 Host: ${databaseUrl.split('@')[1]?.split('/')[0] || 'No detectado'}`);
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔄 Conectando a Neon...');
    await client.connect();
    console.log('✅ Conexión exitosa a Neon!');
    
    // Probar consulta básica
    console.log('🔄 Probando consulta básica...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('📊 Información de la base de datos:');
    console.log(`   🐘 PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`   🗄️  Base de datos: ${result.rows[0].current_database}`);
    console.log(`   👤 Usuario: ${result.rows[0].current_user}`);
    
    // Verificar tablas existentes
    console.log('🔄 Verificando tablas existentes...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Tablas encontradas:');
      tablesResult.rows.forEach(row => {
        console.log(`   📄 ${row.table_name}`);
      });
    } else {
      console.log('📋 No hay tablas en la base de datos');
      console.log('💡 Ejecuta las migraciones: npm run migration:run');
    }
    
    // Verificar extensiones
    console.log('🔄 Verificando extensiones...');
    const extensionsResult = await client.query(`
      SELECT extname 
      FROM pg_extension 
      ORDER BY extname
    `);
    
    if (extensionsResult.rows.length > 0) {
      console.log('🔌 Extensiones instaladas:');
      extensionsResult.rows.forEach(row => {
        console.log(`   🔧 ${row.extname}`);
      });
    }
    
    console.log('✅ Prueba de conexión completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error conectando a Neon:');
    console.error(`   📝 Mensaje: ${error.message}`);
    console.error(`   🔍 Código: ${error.code}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Posibles soluciones:');
      console.log('   - Verifica que la URL de conexión sea correcta');
      console.log('   - Confirma que el proyecto de Neon esté activo');
    } else if (error.code === '28P01') {
      console.log('💡 Posibles soluciones:');
      console.log('   - Verifica el usuario y contraseña');
      console.log('   - Confirma que las credenciales sean correctas');
    } else if (error.code === '3D000') {
      console.log('💡 Posibles soluciones:');
      console.log('   - Verifica que el nombre de la base de datos sea correcto');
      console.log('   - Confirma que la base de datos exista en Neon');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testNeonConnection().catch(console.error);
}

module.exports = { testNeonConnection };
