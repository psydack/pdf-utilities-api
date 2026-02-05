require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { getPageCount, extractPages, mergePdfs, compressPdf, getMetadata } = require('./pdf-utils');
const { paymentMiddleware } = require('@x402/express');
const { x402ResourceServer, HTTPFacilitatorClient } = require('@x402/core/server');
const { registerExactEvmScheme } = require('@x402/evm/exact/server');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PORT = process.env.PORT || 3000;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';
const NETWORK = process.env.NETWORK || 'eip155:84532';
const PRICE = '$0.00025';

if (!WALLET_ADDRESS) {
  console.error('❌ ERROR: WALLET_ADDRESS environment variable is required');
  console.error('Create a .env file with WALLET_ADDRESS=0xYourAddress');
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const x402Server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(x402Server);

const x402Routes = {
  'POST /pdf/info': {
    accepts: [{ scheme: 'exact', price: PRICE, network: NETWORK, payTo: WALLET_ADDRESS }],
    description: 'Get PDF metadata and page count',
    mimeType: 'multipart/form-data'
  },
  'POST /pdf/extract': {
    accepts: [{ scheme: 'exact', price: PRICE, network: NETWORK, payTo: WALLET_ADDRESS }],
    description: 'Extract pages from a PDF',
    mimeType: 'multipart/form-data'
  },
  'POST /pdf/merge': {
    accepts: [{ scheme: 'exact', price: PRICE, network: NETWORK, payTo: WALLET_ADDRESS }],
    description: 'Merge multiple PDFs',
    mimeType: 'multipart/form-data'
  },
  'POST /pdf/compress': {
    accepts: [{ scheme: 'exact', price: PRICE, network: NETWORK, payTo: WALLET_ADDRESS }],
    description: 'Compress a PDF',
    mimeType: 'multipart/form-data'
  }
};

app.use(paymentMiddleware(x402Routes, x402Server));

/**
 * POST /pdf/info
 * Get PDF metadata and page count
 */
app.post('/pdf/info', upload.single('pdf'), async (req, res) => {
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
app.post('/pdf/extract', upload.single('pdf'), async (req, res) => {
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
app.post('/pdf/merge', upload.array('pdfs', 10), async (req, res) => {
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
app.post('/pdf/compress', upload.single('pdf'), async (req, res) => {
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
    payment: { price: '$0.00025 USDC', network: 'Base' }
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
