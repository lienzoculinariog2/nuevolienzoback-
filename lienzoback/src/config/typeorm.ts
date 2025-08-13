import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

// No forzar dotenv aquí, Nest se encarga si lo configuras en AppModule
// dotenvConfig({ path: '.env.development' });

const config = {
  type: 'postgres',
  url: process.env.DATABASE_URL || undefined, // Para Render puedes usar URL directa
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: process.env.NODE_ENV !== 'production', // Desactivar sync en producción
  logging: process.env.NODE_ENV !== 'production',
  dropSchema: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Render usa SSL
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
};

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions);

