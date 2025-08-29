import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

// Solo cargar .env en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenvConfig({ path: '.env.development' });
}

// Configuración para Render (producción) vs desarrollo local
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  type: 'postgres',
  // En producción usar DATABASE_URL, en desarrollo usar variables individuales
  url: isProduction ? process.env.DATABASE_URL : undefined,
  database: isProduction ? undefined : process.env.DB_NAME,
  host: isProduction ? undefined : process.env.DB_HOST,
  port: isProduction ? undefined : process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: isProduction ? undefined : process.env.DB_USERNAME,
  password: isProduction ? undefined : process.env.DB_PASSWORD,
  // ✅ SEGURO: Usar variable de entorno para controlar sincronización
  // En desarrollo: true (facilita setup), En producción: false (seguridad)
  synchronize: process.env.TYPEORM_SYNC === 'true',
  logging: !isProduction, // Solo logging en desarrollo
  dropSchema: process.env.TYPEORM_DROP === 'true',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  // Configuración SSL para Render
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Configuración para manejar dependencias
  extra: {
    // Forzar CASCADE en operaciones de drop
    statement_timeout: 60000,
  },
};

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions);
