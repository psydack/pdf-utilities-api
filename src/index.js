require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { getPageCount, extractPages, mergePdfs, compressPdf, getMetadata } = require('./pdf-utils');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PORT = process.env.PORT || 3000;

if (!WALLET_ADDRESS) {
  console.error('❌ ERROR: WALLET_ADDRESS environment variable is required');
  console.error('Create a .env file with WALLET_ADDRESS=0xYourAddress');
  process.exit(1);
}

// x402 middleware
const requirePayment = (req, res, next) => {
  if (req.headers['x-payment']) return next();

  res.status(402);
  res.setHeader('PAYMENT-REQUIRED', Buffer.from(JSON.stringify({
    x402Version: 2,
    accepts: [{ scheme: 'exact', network: 'eip155:8453', amount: '500', payTo: WALLET_ADDRESS, asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }]
  })).toString('base64'));
  res.json({ message: 'Payment required', price: '$0.0005 USDC' });
};

/**
 * POST /pdf/info
 * Get PDF metadata and page count
 */
app.post('/pdf/info', upload.single('pdf'), requirePayment, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  try {
    const metadata = await getMetadata(req.file.buffer);
    res.json({
      filename: req.file.originalname,
      size: req.file.size,
      ...metadata
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /pdf/extract
 * Extract pages from PDF
 */
app.post('/pdf/extract', upload.single('pdf'), requirePayment, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const { pages } = req.body; // e.g., "0-2,5,7-9"

  try {
    const pageRanges = parsePageRanges(pages);
    const extractedPdf = await extractPages(req.file.buffer, pageRanges);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="extracted-${req.file.originalname}"`);
    res.send(Buffer.from(extractedPdf));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /pdf/merge
 * Merge multiple PDFs
 */
app.post('/pdf/merge', upload.array('pdfs', 10), requirePayment, async (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: 'At least 2 PDF files required' });
  }

  try {
    const pdfBuffers = req.files.map(f => f.buffer);
    const mergedPdf = await mergePdfs(pdfBuffers);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    res.send(Buffer.from(mergedPdf));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /pdf/compress
 * Compress PDF
 */
app.post('/pdf/compress', upload.single('pdf'), requirePayment, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  try {
    const compressedPdf = await compressPdf(req.file.buffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed-${req.file.originalname}"`);
    res.send(Buffer.from(compressedPdf));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    service: 'PDF Utilities API',
    version: '1.0.0',
    endpoints: {
      info: 'POST /pdf/info',
      extract: 'POST /pdf/extract',
      merge: 'POST /pdf/merge',
      compress: 'POST /pdf/compress'
    },
    max_file_size: '25MB',
    payment: { price: '$0.0005 USDC', network: 'Base' }
  });
});

// Parse page ranges like "0-2,5,7-9"
function parsePageRanges(rangeStr) {
  const ranges = [];
  const parts = rangeStr.split(',');

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      ranges.push([start, end]);
    } else {
      const page = parseInt(part.trim());
      ranges.push([page, page]);
    }
  }

  return ranges;
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PDF Utilities API running on port ${PORT}`);
  });
}

module.exports = app;
