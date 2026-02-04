const request = require('supertest');
const { PDFDocument } = require('pdf-lib');

process.env.WALLET_ADDRESS = '0xTestWalletAddressOnBase';
const app = require('../src/index');

describe('PDF Utilities API', () => {
  async function createPdfBuffer() {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([200, 200]);
    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }

  test('POST /pdf/info without payment returns 402 with payment-required header', async () => {
    const res = await request(app)
      .post('/pdf/info')
      .attach('pdf', Buffer.from('dummy'), 'test.pdf');

    expect(res.status).toBe(402);
    expect(res.headers).toHaveProperty('payment-required');

    const payload = JSON.parse(Buffer.from(res.headers['payment-required'], 'base64').toString('utf-8'));
    expect(payload.x402Version).toBe(2);
    expect(payload.accepts[0]).toHaveProperty('scheme', 'exact');
    expect(payload.accepts[0]).toHaveProperty('network', 'eip155:8453');
    expect(payload.accepts[0]).toHaveProperty('payTo');
    expect(payload.accepts[0]).toHaveProperty('asset');
    expect(payload.accepts[0]).toHaveProperty('amount');
  });

  test('POST /pdf/info with payment returns metadata', async () => {
    const pdfBuffer = await createPdfBuffer();
    const res = await request(app)
      .post('/pdf/info')
      .set('x-payment', 'test')
      .attach('pdf', pdfBuffer, 'test.pdf');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pageCount', 1);
    expect(res.body).toHaveProperty('filename', 'test.pdf');
  });
});