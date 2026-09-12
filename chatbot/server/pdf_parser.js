const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pdfParse = require('pdf-parse');

/**
 * Extracts text and page information from a PDF buffer
 * Dual-engine: tries pdf-parse first, falls back to pypdf for modern/complex PDFs
 */
async function extractPDFText(buffer) {
  // 1. Try pdf-parse
  try {
    const data = await pdfParse(buffer);
    if (data && data.text && data.text.trim().length > 0) {
      return {
        text: data.text,
        numpages: data.numpages || 1
      };
    }
  } catch (err) {
    console.warn('pdf-parse notice (switching to resilient pypdf engine):', err.message);
  }

  // 2. Fallback to Python pypdf engine
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `pdf_rag_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`);
    fs.writeFileSync(tempFile, buffer);

    const pyScript = `
import json, sys
try:
    from pypdf import PdfReader
    reader = PdfReader(sys.argv[1])
    pages = []
    for i, p in enumerate(reader.pages):
        t = p.extract_text() or ''
        pages.append(f'-- PAGE {i+1} --\\n' + t)
    full_text = '\\n\\n'.join(pages)
    print(json.dumps({'text': full_text, 'numpages': len(reader.pages)}))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;

    const pyProc = spawn('python', ['-c', pyScript, tempFile]);
    let stdout = '';
    let stderr = '';

    pyProc.stdout.on('data', d => { stdout += d.toString(); });
    pyProc.stderr.on('data', d => { stderr += d.toString(); });

    pyProc.on('close', code => {
      try { fs.unlinkSync(tempFile); } catch (e) {}

      if (code !== 0) {
        return reject(new Error(`PDF extraction process failed: ${stderr}`));
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (parseErr) {
        reject(new Error(`Failed to parse PDF extractor output: ${stdout}`));
      }
    });
  });
}

module.exports = { extractPDFText };
