require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function ingest() {
  const csvPath = path.join(__dirname, '..', 'sample_documents', 'computer_science_students.csv');
  const jsonPath = path.join(__dirname, '..', 'sample_documents', 'computer_science_students.json');
  
  console.log('🚀 Checking server endpoint http://localhost:3000/api/ingest/students...');
  try {
    const csvBuffer = fs.readFileSync(csvPath);
    const blob = new Blob([csvBuffer], { type: 'text/csv' });

    const formData = new FormData();
    formData.append('file', blob, 'computer_science_students.csv');
    formData.append('title', 'Computer Science & Engineering Department Student Database (200 Students)');

    const res = await fetch('http://localhost:3000/api/ingest/students', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Ingestion completed via server API:', data);
      return;
    }
    console.log('⚠️ Server returned status:', res.status, '- attempting direct internal ingestion...');
  } catch (netErr) {
    console.log('ℹ️ Server not online at :3000. Running direct ingestion into storage...');
  }

  // Fallback: Direct in-process ingestion into db
  const { initDB, db } = require('../server/db');
  const { ingestDepartmentData } = require('../server/rag');

  await initDB();
  const fileBuffer = fs.readFileSync(csvPath);
  const result = await ingestDepartmentData({
    buffer: fileBuffer,
    filename: 'computer_science_students.csv',
    title: 'Computer Science Department Database (200 Students)',
    category: 'department_students'
  });

  console.log(`🎉 Successfully ingested ${result.chunkCount} student profiles into Vector Database!`);
}

ingest().catch(console.error);
