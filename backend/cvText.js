// Extraction du texte d'un CV envoyé en data-URL (PDF, DOCX ou texte brut)
const mammoth = require('mammoth');

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]*)((?:;[^;,]*)*),([\s\S]*)$/.exec(dataUrl || '');
  if (!match) return null;
  const isBase64 = match[2].includes(';base64');
  return {
    mime: match[1] || 'application/octet-stream',
    buffer: Buffer.from(match[3], isBase64 ? 'base64' : 'utf8'),
  };
}

async function extractCvText(dataUrl, fileName = '') {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return '';
  const name = fileName.toLowerCase();
  const { mime, buffer } = parsed;

  try {
    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      // unpdf (pdf.js moderne) est un module ESM : import dynamique depuis CommonJS
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return (text || '').replace(/\s+/g, ' ').trim();
    }
    if (name.endsWith('.docx') || mime.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').replace(/\s+/g, ' ').trim();
    }
    if (mime.startsWith('text/') || name.endsWith('.txt')) {
      return buffer.toString('utf8').replace(/\s+/g, ' ').trim();
    }
  } catch (err) {
    console.error('Extraction du CV impossible :', err.message);
  }
  return '';
}

module.exports = { parseDataUrl, extractCvText };
