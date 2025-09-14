/**
 * 🔧 Tipos globales para Multer
 * 
 * Este archivo soluciona los problemas de tipos con Express.Multer.File
 */

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export {};
