const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'sample_documents', 'computer_science_students.csv');
const jsonPath = path.join(__dirname, '..', 'sample_documents', 'computer_science_students.json');

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
const headers = lines[0].split(',').map(h => h.trim());
const students = [];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

for (let i = 1; i < lines.length; i++) {
  const vals = parseCSVLine(lines[i]);
  const s = {};
  headers.forEach((h, idx) => {
    let val = vals[idx] || '';
    if (['student_id', 'age', 'enrollment_year', 'current_semester', 'attendance_percentage'].includes(h)) {
      s[h] = parseInt(val, 10) || 0;
    } else if (['cgpa', 'package_lpa'].includes(h)) {
      s[h] = parseFloat(val) || 0;
    } else {
      s[h] = val;
    }
  });
  students.push(s);
}

fs.writeFileSync(jsonPath, JSON.stringify(students, null, 2));
console.log('Successfully generated JSON with', students.length, 'students at', jsonPath);
