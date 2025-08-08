import { Readable } from 'stream';

export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Marca el fin del stream
  return stream;
}
