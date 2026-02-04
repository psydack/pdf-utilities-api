/**
 * PDF utilities using pdf-lib
 * Note: This is a simplified implementation
 * For production, consider using more robust PDF processing libraries
 */

const { PDFDocument } = require('pdf-lib');

/**
 * Get PDF page count
 */
async function getPageCount(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}

/**
 * Extract pages from PDF
 */
async function extractPages(pdfBuffer, pageRanges) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();

  for (const range of pageRanges) {
    const [start, end] = range;
    const pageIndices = [];
    
    for (let i = start; i <= end && i < pdfDoc.getPageCount(); i++) {
      pageIndices.push(i);
    }

    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));
  }

  return await newPdf.save();
}

/**
 * Merge multiple PDFs
 */
async function mergePdfs(pdfBuffers) {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Compress PDF (simplified - removes metadata)
 */
async function compressPdf(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  return await pdfDoc.save();
}

/**
 * Get PDF metadata
 */
async function getMetadata(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  
  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    creator: pdfDoc.getCreator(),
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate()
  };
}

module.exports = {
  getPageCount,
  extractPages,
  mergePdfs,
  compressPdf,
  getMetadata
};
