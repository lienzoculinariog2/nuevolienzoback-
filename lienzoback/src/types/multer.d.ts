import type { File as MulterFile } from 'multer';

declare global {
  namespace Express {
    type MulterFile = MulterFile;
  }
}
