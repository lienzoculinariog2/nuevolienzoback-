const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

const isProduction = process.env.NODE_ENV === 'production';

const dataSource = new DataSource({
  type: 'postgres',
  url: isProduction ? process.env.DATABASE_URL : undefined,
  database: isProduction ? undefined : process.env.DB_NAME,
  host: isProduction ? undefined : process.env.DB_HOST,
  port: isProduction ? undefined : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
  username: isProduction ? undefined : process.env.DB_USERNAME,
  password: isProduction ? undefined : process.env.DB_PASSWORD,
  entities: [path.join(__dirname, 'dist/**/*.entity.js')],
  migrations: [path.join(__dirname, 'dist/migrations/*.js')],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: true,
});

async function runMigrations() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await dataSource.initialize();
    
    console.log('📦 Ejecutando migraciones...');
    const pendingMigrations = await dataSource.showMigrations();
    
    if (pendingMigrations) {
      console.log('📦 Migraciones pendientes encontradas, ejecutando...');
      await dataSource.runMigrations();
      console.log('✅ Migraciones ejecutadas exitosamente');
    } else {
      console.log('✅ No hay migraciones pendientes');
    }

    // Verificar que la tabla products_ingredients existe
    console.log('🔍 Verificando tabla products_ingredients...');
    const tableExists = await checkTableExists('products_ingredients');
    
    if (!tableExists) {
      console.log('⚠️ La tabla products_ingredients no existe, creándola...');
      await createProductsIngredientsTable();
      console.log('✅ Tabla products_ingredients creada exitosamente');
    } else {
      console.log('✅ La tabla products_ingredients ya existe');
    }

  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await dataSource.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result[0].exists;
  } catch (error) {
    console.error(`Error verificando existencia de tabla ${tableName}:`, error);
    return false;
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

// Ejecutar migraciones
runMigrations();
