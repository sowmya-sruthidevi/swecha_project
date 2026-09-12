const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createSamplePDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const page1 = pdfDoc.addPage([600, 800]);
  page1.drawText('Quantum Computing & Next-Gen Algorithms', {
    x: 50,
    y: 730,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4)
  });

  const page1Text = 
`1. Introduction to Quantum Information Science
Quantum computing is a rapidly advancing technology that harnesses the phenomena of quantum
mechanics to solve complex mathematical problems beyond the reach of classical computers.
While classical computers encode information into binary digits (bits) of 0 or 1, quantum
computers utilize quantum bits, or qubits.

2. Principles: Superposition and Entanglement
- Superposition: Allows a qubit to exist simultaneously as a linear combination of states |0> and |1>.
  This provides massive computational parallelism for specific problem spaces.
- Entanglement: Two or more qubits become inextricably correlated, such that the state of one
  qubit dictates the state of another regardless of the distance between them.
- Quantum Interference: Directs computational probabilities toward correct solutions while canceling
  out incorrect answers.

3. Leading Applications
- Shor's Algorithm: Provides exponential speedup in integer factorization, impacting RSA encryption.
- Grover's Search: Quadratic speedup for searching unstructured databases.
- Quantum Chemistry: Precise simulation of molecular bonds and reaction catalysts for pharmacology.`;

  page1.drawText(page1Text, {
    x: 50,
    y: 680,
    size: 11,
    font: font,
    lineHeight: 18,
    color: rgb(0.15, 0.15, 0.15)
  });

  // Page 2
  const page2 = pdfDoc.addPage([600, 800]);
  page2.drawText('Challenges & Future Roadmap', {
    x: 50,
    y: 730,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4)
  });

  const page2Text = 
`4. Critical Engineering Challenges
Despite substantial experimental breakthroughs, several major hurdles prevent widespread fault-tolerant scaling:
- Quantum Decoherence: Environmental interactions (thermal fluctuations, stray magnetic fields, cosmic rays)
  cause fragile qubits to lose their quantum state within microseconds.
- High Error Rates: Physical qubits experience gate fidelity limits orders of magnitude higher than classical transistors.
- Quantum Error Correction (QEC): Requires thousands of physical qubits to produce a single fault-tolerant logical qubit.
- Cryogenic Requirements: Superconducting circuits demand cooling down to 15 millikelvin, near absolute zero.

5. Summary and Conclusion
Fault-tolerant quantum computing will revolutionize materials science, cryptography, and artificial intelligence,
provided the quantum error threshold and coherence preservation challenges are overcome.`;

  page2.drawText(page2Text, {
    x: 50,
    y: 680,
    size: 11,
    font: font,
    lineHeight: 18,
    color: rgb(0.15, 0.15, 0.15)
  });

  const pdfBytes = await pdfDoc.save();
  const dir = path.join(__dirname, '..', 'sample_documents');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const targetPath = path.join(dir, 'quantum_computing_overview.pdf');
  fs.writeFileSync(targetPath, pdfBytes);
  console.log('Successfully generated clean valid PDF at:', targetPath, 'Size:', pdfBytes.length, 'bytes');
}

createSamplePDF().catch(console.error);
