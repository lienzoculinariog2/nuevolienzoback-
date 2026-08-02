const { DataSource } = require('typeorm');
const path = require('path');

// Intentar cargar .env.development si existe
try {
  require('dotenv').config({ path: '.env.development' });
} catch (error) {
  console.log('⚠️ Archivo .env.development no encontrado, usando valores por defecto');
}

const isProduction = process.env.NODE_ENV === 'production';

const dataSource = new DataSource({
  type: 'postgres',
  url: isProduction ? process.env.DATABASE_URL : undefined,
  database: isProduction ? undefined : (process.env.DB_NAME || 'lienzoCulinario'),
  host: isProduction ? undefined : (process.env.DB_HOST || 'localhost'),
  port: isProduction ? undefined : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
  username: isProduction ? undefined : (process.env.DB_USERNAME || 'postgres'),
  password: isProduction ? undefined : (process.env.DB_PASSWORD || 'postgres'),
  entities: [path.join(__dirname, 'dist/**/*.entity.js')],
  migrations: [path.join(__dirname, 'dist/migrations/*.js')],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: true,
});

async function cleanDuplicateTables() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await dataSource.initialize();
    
    console.log('🧹 Verificando tablas duplicadas...');
    
    // Obtener todas las tablas
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Verificar si hay tablas duplicadas (mismo nombre en diferentes casos)
    const tableNames = tables.map(t => t.table_name);
    const duplicates = [];
    
    for (let i = 0; i < tableNames.length; i++) {
      for (let j = i + 1; j < tableNames.length; j++) {
        if (tableNames[i].toLowerCase() === tableNames[j].toLowerCase() && 
            tableNames[i] !== tableNames[j]) {
          duplicates.push([tableNames[i], tableNames[j]]);
        }
      }
    }
    
    if (duplicates.length > 0) {
      console.log('⚠️ Tablas duplicadas encontradas:');
      duplicates.forEach(([table1, table2]) => {
        console.log(`  - ${table1} y ${table2}`);
      });
      
      console.log('🗑️ Eliminando tablas duplicadas (manteniendo las que están en minúsculas)...');
      
      for (const [table1, table2] of duplicates) {
        const tableToDrop = table1 === table1.toLowerCase() ? table2 : table1;
        console.log(`  Eliminando tabla: ${tableToDrop}`);
        
        try {
          await dataSource.query(`DROP TABLE IF EXISTS "${tableToDrop}" CASCADE`);
          console.log(`  ✅ Tabla ${tableToDrop} eliminada`);
        } catch (error) {
          console.log(`  ❌ Error eliminando tabla ${tableToDrop}:`, error.message);
        }
      }
    } else {
      console.log('✅ No se encontraron tablas duplicadas');
    }
    
    // Verificar que la tabla products_ingredients existe
    console.log('🔍 Verificando tabla products_ingredients...');
    const productsIngredientsExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products_ingredients'
      )
    `);
    
    if (!productsIngredientsExists[0].exists) {
      console.log('⚠️ La tabla products_ingredients no existe, creándola...');
      await createProductsIngredientsTable();
      console.log('✅ Tabla products_ingredients creada');
    } else {
      console.log('✅ La tabla products_ingredients ya existe');
    }
    
  } catch (error) {
    console.error('❌ Error limpiando tablas duplicadas:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function createProductsIngredientsTable() {
  try {
    // Crear tabla de relación many-to-many entre products e ingredients
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "products_ingredients" (
        "products_id" uuid NOT NULL,
        "ingredients_id" uuid NOT NULL,
        CONSTRAINT "PK_products_ingredients" PRIMARY KEY ("products_id", "ingredients_id")
      )
    `);

    // Crear índices para mejorar rendimiento
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_products_id" 
      ON "products_ingredients" ("products_id")
    `);

    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_ingredients_ingredients_id" 
      ON "products_ingredients" ("ingredients_id")
    `);

    // Agregar foreign keys
    await dataSource.query(`
      ALTER TABLE "products_ingredients" 
      ADD CONSTRAINT "FK_products_ingredients_products_id" 
      FOREIGN KEY ("products_id") REFERENCES "products"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await dataSource.query(`
      ALTER TABLE "products_ingredients" 
      ADD CONSTRAINT "FK_products_ingredients_ingredients_id" 
      FOREIGN KEY ("ingredients_id") REFERENCES "ingredients"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

  } catch (error) {
    console.error('Error creando tabla products_ingredients:', error);
    throw error;
  }
}

// Ejecutar limpieza
cleanDuplicateTables();
