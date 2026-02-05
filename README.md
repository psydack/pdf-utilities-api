# PDF Utilities API

Split, merge, compress, and extract pages from PDF documents with x402 micropayments.

## 🌟 Features

- ✅ **Split PDF** - Extract specific pages
- ✅ **Merge PDFs** - Combine multiple PDFs
- ✅ **Compress PDF** - Optimize file size
- ✅ **Get Info** - Page count and metadata
- ✅ **25MB Limit** - Handle large PDFs
- ✅ **x402 Payments** - $0.00025 USDC per operation

## 📋 Endpoints

### POST /pdf/info

Get PDF metadata and page count.

### POST /pdf/extract

Extract pages from PDF. Parameter: `pages` (e.g., "0-2,5,7-9")

### POST /pdf/merge

Merge multiple PDFs (upload up to 10 files).

### POST /pdf/compress

Compress PDF to reduce file size.

## 💰 Payments

- **Price**: $0.00025 USDC per operation
- **Network**: Base (Chain ID 8453)

## 📝 License

ISC

---

**Built for Clawmart x402 Marketplace** 📄

**Repository**: https://github.com/psydack/pdf-utilities-api
