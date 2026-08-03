import { Controller, INestApplication, Post, RawBodyRequest, Req } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';

@Controller('raw-body-probe')
class RawBodyProbeController {
  @Post()
  probe(@Req() req: RawBodyRequest<Request>) {
    return {
      hasRawBody: Buffer.isBuffer(req.rawBody),
      rawBody: req.rawBody?.toString('utf8'),
    };
  }
}

describe('Raw request body configuration', () => {
  let app: INestApplication & NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RawBodyProbeController],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
    app.useBodyParser('json', { limit: '10mb' });
    app.useBodyParser('urlencoded', { limit: '10mb', extended: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('preserves the exact JSON bytes required for Stripe signature verification', async () => {
    const payload = '{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_test"}}}';

    const response = await request(app.getHttpServer())
      .post('/raw-body-probe')
      .set('content-type', 'application/json')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({
      hasRawBody: true,
      rawBody: payload,
    });
  });
});
