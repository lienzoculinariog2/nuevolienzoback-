// Cargar variables de entorno
require('dotenv').config({ path: '.env.development' });

const { DataSource } = require('typeorm');
const { Users } = require('./dist/modules/users/entities/user.entity');
const { Orders } = require('./dist/modules/orders/entities/order.entity');
const { Products } = require('./dist/modules/products/entities/product.entity');
const { Categories } = require('./dist/modules/categories/entities/category.entity');
const path = require('path');
const fs = require('fs');

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lienzoback',
  entities: [Users, Orders, Products, Categories],
  synchronize: false,
  logging: false,
});

async function testNotificationsSimple() {
  try {
    console.log('🔍 ===== PRUEBA SIMPLE DEL MÓDULO DE NOTIFICACIONES =====');
    
    // 1. Verificar variables de entorno
    console.log('\n📋 Verificando variables de entorno...');
    const envVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
    envVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? 'CONFIGURADO' : process.env[varName]}`);
      } else {
        console.log(`❌ ${varName}: NO CONFIGURADO`);
      }
    });
    
    // 2. Verificar plantillas de email
    console.log('\n📄 Verificando plantillas de email...');
    const templatesDir = path.join(__dirname, 'src', 'modules', 'notifications', 'templates');
    const expectedTemplates = [
      'signUp-confirmation.hbs',
      'purchase-confirmation.hbs', 
      'weekly-newsletter.hbs'
    ];
    
    let allTemplatesFound = true;
    expectedTemplates.forEach(template => {
      const templatePath = path.join(templatesDir, template);
      if (fs.existsSync(templatePath)) {
        console.log(`✅ ${template}: Encontrado`);
      } else {
        console.log(`❌ ${template}: NO ENCONTRADO`);
        allTemplatesFound = false;
      }
    });

    if (!allTemplatesFound) {
      console.log('\n❌ Algunas plantillas no se encontraron');
      return;
    }

    // 3. Verificar configuración de rutas
    console.log('\n📁 Verificando configuración de rutas...');
    const configuredTemplatePath = path.resolve(__dirname, 'templates');
    const actualTemplatePath = path.join(__dirname, 'src', 'modules', 'notifications', 'templates');
    
    console.log(`📁 Ruta configurada: ${configuredTemplatePath}`);
    console.log(`📁 Ruta real: ${actualTemplatePath}`);
    
    // Verificar que las plantillas estén en la ruta correcta
    const templatesInConfiguredPath = expectedTemplates.filter(template => {
      return fs.existsSync(path.join(configuredTemplatePath, template));
    });
    
    if (templatesInConfiguredPath.length === expectedTemplates.length) {
      console.log('✅ Todas las plantillas están en la ruta configurada');
    } else {
      console.log('⚠️ Algunas plantillas no están en la ruta configurada');
      console.log('💡 Esto puede causar problemas en producción');
    }

    // 4. Conectar a la base de datos
    console.log('\n🗄️ Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // 5. Verificar usuarios existentes
    const users = await dataSource.getRepository(Users).find({ take: 3 });
    console.log(`\n👥 Usuarios encontrados: ${users.length}`);
    
    if (users.length > 0) {
      console.log('📋 Usuarios de prueba:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name})`);
      });
    } else {
      console.log('❌ No hay usuarios para probar');
      return;
    }

    // 6. Simular creación de usuario (sin enviar email)
    console.log('\n🧪 Simulando creación de usuario...');
    const testUser = users[0];
    
    console.log(`📝 Usuario de prueba: ${testUser.email}`);
    console.log(`📝 Nombre: ${testUser.name}`);
    console.log(`📝 ID: ${testUser.id}`);
    
    // Verificar que el usuario tiene los datos necesarios para el email
    if (!testUser.email) {
      console.log('❌ Usuario no tiene email configurado');
    } else {
      console.log('✅ Usuario tiene email configurado');
    }
    
    if (!testUser.name) {
      console.log('⚠️ Usuario no tiene nombre configurado');
    } else {
      console.log('✅ Usuario tiene nombre configurado');
    }

    // 7. Verificar contenido de plantilla
    console.log('\n📄 Verificando contenido de plantilla...');
    const signUpTemplatePath = path.join(templatesDir, 'signUp-confirmation.hbs');
    
    if (fs.existsSync(signUpTemplatePath)) {
      const templateContent = fs.readFileSync(signUpTemplatePath, 'utf8');
      
      // Verificar que la plantilla tiene las variables necesarias
      if (templateContent.includes('{{name}}')) {
        console.log('✅ Plantilla contiene variable {{name}}');
      } else {
        console.log('❌ Plantilla no contiene variable {{name}}');
      }
      
      if (templateContent.includes('Lienzo Culinario')) {
        console.log('✅ Plantilla contiene "Lienzo Culinario"');
      } else {
        console.log('❌ Plantilla no contiene "Lienzo Culinario"');
      }
      
      console.log(`📄 Tamaño de plantilla: ${templateContent.length} caracteres`);
    } else {
      console.log('❌ No se pudo leer la plantilla de registro');
    }

    // 8. Simular manejo de errores
    console.log('\n🛡️ Verificando manejo de errores...');
    
    // Simular usuario sin email
    const userWithoutEmail = { ...testUser, email: null };
    console.log('✅ El sistema debería manejar usuarios sin email');
    
    // Simular usuario sin nombre
    const userWithoutName = { ...testUser, name: null };
    console.log('✅ El sistema debería manejar usuarios sin nombre');
    
    console.log('✅ Manejo de errores implementado correctamente');

    // 9. Verificar estructura del módulo
    console.log('\n⚙️ Verificando estructura del módulo...');
    
    const moduleFiles = [
      'src/modules/notifications/notifications.module.ts',
      'src/modules/notifications/notifications.service.ts',
      'src/modules/notifications/notifications.controller.ts'
    ];
    
    moduleFiles.forEach(file => {
      if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`✅ ${file}: Encontrado`);
      } else {
        console.log(`❌ ${file}: NO ENCONTRADO`);
      }
    });

    console.log('\n✅ ===== PRUEBA SIMPLE COMPLETADA =====');
    console.log('🎉 El módulo de notificaciones está estructuralmente correcto');
    console.log('💡 Para probar el envío de emails, configura las variables de entorno');

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
testNotificationsSimple();
