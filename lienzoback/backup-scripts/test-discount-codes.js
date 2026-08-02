const { DataSource } = require('typeorm');
const { DiscountCodes } = require('./dist/modules/discount-codes/entities/discount-codes.entity');
const { DiscountCodesUsed } = require('./dist/modules/discount-codes/entities/discount-codes-used.entity');
const { Users } = require('./dist/modules/users/entities/user.entity');
const { Orders } = require('./dist/modules/orders/entities/order.entity');

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lienzoback',
  entities: [DiscountCodes, DiscountCodesUsed, Users, Orders],
  synchronize: false,
  logging: true,
});

async function testDiscountCodes() {
  try {
    console.log('🔍 Iniciando prueba de códigos de descuento...');
    
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // 1. Verificar si existen códigos de descuento
    const discountCodes = await dataSource.getRepository(DiscountCodes).find();
    console.log(`📊 Códigos de descuento encontrados: ${discountCodes.length}`);
    
    if (discountCodes.length > 0) {
      console.log('📋 Códigos disponibles:');
      discountCodes.forEach(code => {
        console.log(`  - ${code.code} (${code.percentage}%) - Activo: ${code.isActive}`);
      });
    }

    // 2. Verificar si existen registros de códigos usados
    const usedCodes = await dataSource.getRepository(DiscountCodesUsed).find({
      relations: ['discountCode', 'user', 'order']
    });
    console.log(`📊 Códigos usados encontrados: ${usedCodes.length}`);
    
    if (usedCodes.length > 0) {
      console.log('📋 Códigos usados:');
      usedCodes.forEach(used => {
        console.log(`  - Código: ${used.discountCode?.code} - Usuario: ${used.user?.email} - Orden: ${used.order?.id}`);
      });
    }

    // 3. Verificar estructura de la tabla discount_codes_used
    const tableInfo = await dataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'discount_codes_used' 
      ORDER BY ordinal_position
    `);
    console.log('📋 Estructura de la tabla discount_codes_used:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 4. Verificar foreign keys
    const foreignKeys = await dataSource.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'discount_codes_used'
    `);
    console.log('🔗 Foreign keys de discount_codes_used:');
    foreignKeys.forEach(fk => {
      console.log(`  - ${fk.constraint_name}: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // 5. Intentar crear un registro de prueba
    console.log('\n🧪 Intentando crear un registro de prueba...');
    
    // Buscar un usuario existente
    const users = await dataSource.getRepository(Users).find({ take: 1 });
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos para la prueba');
      return;
    }
    
    const testUser = users[0];
    console.log(`👤 Usuario de prueba: ${testUser.email}`);

    // Buscar una orden existente
    const orders = await dataSource.getRepository(Orders).find({ 
      where: { user: { id: testUser.id } },
      take: 1 
    });
    
    if (orders.length === 0) {
      console.log('❌ No hay órdenes para el usuario de prueba');
      return;
    }
    
    const testOrder = orders[0];
    console.log(`📦 Orden de prueba: ${testOrder.id}`);

    // Buscar un código de descuento existente
    if (discountCodes.length === 0) {
      console.log('❌ No hay códigos de descuento para la prueba');
      return;
    }
    
    const testDiscountCode = discountCodes[0];
    console.log(`🎫 Código de descuento de prueba: ${testDiscountCode.code}`);

    // Crear registro de prueba
    const testUsedCode = dataSource.getRepository(DiscountCodesUsed).create({
      discountCode: { id: testDiscountCode.id },
      user: { id: testUser.id },
      order: { id: testOrder.id },
      usedAt: new Date()
    });

    const savedUsedCode = await dataSource.getRepository(DiscountCodesUsed).save(testUsedCode);
    console.log(`✅ Registro de prueba creado exitosamente: ${savedUsedCode.id}`);

    // Verificar que se guardó correctamente
    const verifyUsedCode = await dataSource.getRepository(DiscountCodesUsed).findOne({
      where: { id: savedUsedCode.id },
      relations: ['discountCode', 'user', 'order']
    });
    
    if (verifyUsedCode) {
      console.log(`✅ Verificación exitosa: ${verifyUsedCode.discountCode.code} usado por ${verifyUsedCode.user.email}`);
    } else {
      console.log('❌ Error: No se pudo verificar el registro creado');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la prueba
testDiscountCodes();
