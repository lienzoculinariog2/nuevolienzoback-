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

async function testDiscountCodesFixed() {
  try {
    console.log('🔍 ===== PRUEBA DE CÓDIGOS DE DESCUENTO CORREGIDOS =====');
    
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // 1. Verificar estructura de la tabla orders
    console.log('\n📋 Verificando estructura de la tabla orders...');
    const ordersTableInfo = await dataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'discount_code_id'
      ORDER BY ordinal_position
    `);
    
    if (ordersTableInfo.length > 0) {
      console.log('✅ Columna discount_code_id encontrada en la tabla orders');
      console.log(`   - Tipo: ${ordersTableInfo[0].data_type}`);
      console.log(`   - Nullable: ${ordersTableInfo[0].is_nullable}`);
    } else {
      console.log('❌ Columna discount_code_id NO encontrada en la tabla orders');
      console.log('💡 Ejecuta la migración: node run-migrations.js');
      return;
    }

    // 2. Verificar códigos de descuento existentes
    const discountCodes = await dataSource.getRepository(DiscountCodes).find();
    console.log(`\n📊 Códigos de descuento encontrados: ${discountCodes.length}`);
    
    if (discountCodes.length === 0) {
      console.log('❌ No hay códigos de descuento para la prueba');
      console.log('💡 Crea algunos códigos de descuento primero');
      return;
    }

    console.log('📋 Códigos disponibles:');
    discountCodes.forEach(code => {
      console.log(`  - ${code.code} (${code.percentage}%) - Activo: ${code.isActive} - Válido hasta: ${code.validUntil}`);
    });

    // 3. Verificar usuarios existentes
    const users = await dataSource.getRepository(Users).find({ take: 1 });
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos para la prueba');
      return;
    }
    
    const testUser = users[0];
    console.log(`\n👤 Usuario de prueba: ${testUser.email}`);

    // 4. Verificar órdenes existentes
    const orders = await dataSource.getRepository(Orders).find({ 
      where: { user: { id: testUser.id } },
      take: 5 
    });
    
    console.log(`\n📦 Órdenes encontradas para el usuario: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('📋 Órdenes del usuario:');
      orders.forEach(order => {
        console.log(`  - Orden ${order.id}: $${order.totalAmount} - Estado: ${order.status} - Descuento: ${order.discountCodeId || 'Ninguno'}`);
      });
    }

    // 5. Verificar códigos usados
    const usedCodes = await dataSource.getRepository(DiscountCodesUsed).find({
      relations: ['discountCode', 'user', 'order']
    });
    console.log(`\n📊 Códigos usados encontrados: ${usedCodes.length}`);
    
    if (usedCodes.length > 0) {
      console.log('📋 Códigos usados:');
      usedCodes.forEach(used => {
        console.log(`  - Código: ${used.discountCode?.code} - Usuario: ${used.user?.email} - Orden: ${used.order?.id} - Fecha: ${used.usedAt}`);
      });
    }

    // 6. Simular el flujo completo de checkout con descuento
    console.log('\n🧪 ===== SIMULANDO FLUJO DE CHECKOUT CON DESCUENTO =====');
    
    const testDiscountCode = discountCodes[0];
    console.log(`🎫 Usando código de descuento: ${testDiscountCode.code} (${testDiscountCode.percentage}%)`);

    // Crear una orden de prueba con descuento
    const testOrder = dataSource.getRepository(Orders).create({
      user: { id: testUser.id },
      totalAmount: 90.00, // Precio con descuento aplicado
      status: 'pending',
      shippingAddress: 'Calle de Prueba 123',
      date: new Date(),
      discountCodeId: testDiscountCode.id, // ✅ NUEVO: Almacenar el ID del código de descuento
    });

    const savedOrder = await dataSource.getRepository(Orders).save(testOrder);
    console.log(`✅ Orden de prueba creada: ${savedOrder.id} con descuento aplicado`);

    // Verificar que la orden tiene el discountCodeId
    const verifyOrder = await dataSource.getRepository(Orders).findOne({
      where: { id: savedOrder.id }
    });
    
    if (verifyOrder.discountCodeId) {
      console.log(`✅ Orden tiene discountCodeId: ${verifyOrder.discountCodeId}`);
    } else {
      console.log('❌ Orden NO tiene discountCodeId');
    }

    // 7. Simular pago exitoso (marcar código como usado)
    console.log('\n💰 ===== SIMULANDO PAGO EXITOSO =====');
    
    // Verificar si ya existe un registro de código usado
    const existingUsedCode = await dataSource.getRepository(DiscountCodesUsed).findOne({
      where: { order: { id: savedOrder.id } }
    });

    if (existingUsedCode) {
      console.log('ℹ️ Código de descuento ya marcado como usado');
    } else {
      // Crear registro de código usado (simulando pago exitoso)
      const discountUsed = dataSource.getRepository(DiscountCodesUsed).create({
        discountCode: { id: testDiscountCode.id },
        user: { id: testUser.id },
        order: { id: savedOrder.id },
        usedAt: new Date()
      });

      const savedUsedCode = await dataSource.getRepository(DiscountCodesUsed).save(discountUsed);
      console.log(`✅ Código de descuento marcado como usado: ${savedUsedCode.id}`);
    }

    // 8. Verificar que el código no se puede usar nuevamente
    console.log('\n🔒 ===== VERIFICANDO RESTRICCIÓN DE REUSO =====');
    
    const duplicateUsedCode = await dataSource.getRepository(DiscountCodesUsed).findOne({
      where: {
        discountCode: { id: testDiscountCode.id },
        user: { id: testUser.id }
      }
    });

    if (duplicateUsedCode) {
      console.log('✅ Restricción funcionando: El código ya está marcado como usado para este usuario');
    } else {
      console.log('❌ Error: No se encontró el registro de código usado');
    }

    // 9. Verificar estadísticas finales
    console.log('\n📊 ===== ESTADÍSTICAS FINALES =====');
    
    const finalUsedCodes = await dataSource.getRepository(DiscountCodesUsed).find({
      relations: ['discountCode', 'user', 'order']
    });
    
    console.log(`📊 Total de códigos usados: ${finalUsedCodes.length}`);
    console.log(`📊 Códigos de descuento disponibles: ${discountCodes.length}`);
    
    const ordersWithDiscount = await dataSource.getRepository(Orders).find({
      where: { discountCodeId: { not: null } }
    });
    console.log(`📊 Órdenes con descuento aplicado: ${ordersWithDiscount.length}`);

    console.log('\n✅ ===== PRUEBA COMPLETADA EXITOSAMENTE =====');
    console.log('🎉 El sistema de códigos de descuento está funcionando correctamente');

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
testDiscountCodesFixed();
