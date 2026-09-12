const fs = require('fs');
const path = require('path');
const { extractPDFText } = require('./pdf_parser');
const { getAIConfig } = require('./ai_config');
const { db } = require('./db');

const aiConfig = getAIConfig();
const apiKey = aiConfig.apiKey;
const isGroq = aiConfig.isGroq;

const aiClient = apiKey
  ? new (require('openai'))({
      apiKey,
      baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined
    })
  : null;

// Session-specific active document vector store: Map<sessionId, docMetadata>
const sessionDocStore = new Map();

// Global Department Vector Database Store: Map<docId, vectorDoc>
const departmentVectorStore = new Map();

/**
 * Calculates cosine similarity between two numeric vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 384-dimensional dense semantic hashing vector (simulating MiniLM-L6-v2 space)
 * Uses tri-gram hashing and word frequency normalization for fast semantic search
 */
function generateTermVector(text) {
  const DIM = 384;
  const vec = new Array(DIM).fill(0);
  if (!text) return vec;

  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  // 1. Unigram frequency
  for (const word of words) {
    let hash = 5381;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) + hash) + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % DIM;
    // Common words down-weighted
    const weight = ['the', 'is', 'at', 'which', 'on', 'in', 'a', 'an', 'and', 'or', 'for', 'with'].includes(word) ? 0.3 : 1.5;
    vec[idx] += weight;

    // 2. Character Tri-grams for sub-word semantic similarity
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const tri = word.slice(i, i + 3);
        let triHash = 0;
        for (let j = 0; j < tri.length; j++) {
          triHash = ((triHash << 5) - triHash) + tri.charCodeAt(j);
          triHash |= 0;
        }
        const triIdx = Math.abs(triHash) % DIM;
        vec[triIdx] += 0.4;
      }
    }
  }

  // Normalize L2 norm
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map(v => v / norm);
}

/**
 * Custom robust CSV parser handling quoted commas and escapes
 */
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

/**
 * Parses CSV table of students into rich, searchable semantic profiles
 * Grounded on the 200 CS Students dataset with structured metadata
 */
function parseCSVToStudentRecords(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const chunks = [];

  for (let i = 1; i < lines.length; i++) {
    const cleanValues = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = cleanValues[idx] || '';
    });

    const studentName = record.name || record.Name || record.student_name || `Student ${i}`;
    const rollNo = record.roll_no || record.RollNo || record.ID || `CSE-${i}`;
    const specialization = record.specialization || record.department || 'Computer Science';
    const cgpa = parseFloat(record.cgpa) || 0;
    const feeStatus = record.fee_status || 'Standard';
    const placementStatus = record.placement_status || 'Not Placed';
    const company = record.company_placed || 'None';
    const packageLpa = parseFloat(record.package_lpa) || 0;
    const skills = record.skills || '';
    const advisor = record.advisor || '';

    // Primary chunk text from dataset profile_text if present, or generated fallback
    const profileText = record.profile_text && record.profile_text.length > 20
      ? record.profile_text
      : `[STUDENT RECORD: ${studentName.toUpperCase()} (Roll No: ${rollNo})]\n` +
        `- Specialization: ${specialization}\n` +
        `- CGPA: ${cgpa}\n` +
        `- Skills: ${skills}\n` +
        `- Academic Advisor: ${advisor}\n` +
        `- Fee Status: ${feeStatus}\n` +
        `- Placement: ${placementStatus} (${company !== 'None' ? company + ', ' + packageLpa + ' LPA' : 'Preparing'})\n` +
        `- Courses: ${record.courses_enrolled || 'N/A'}\n` +
        `- Extracurricular: ${record.extracurricular_activity || 'None'}`;

    const metadata = {
      student_id: parseInt(record.student_id, 10) || i,
      roll_no: rollNo,
      name: studentName,
      gender: record.gender || 'Unspecified',
      age: parseInt(record.age, 10) || 20,
      email: record.email || '',
      phone: record.phone || '',
      enrollment_year: parseInt(record.enrollment_year, 10) || 2024,
      current_semester: parseInt(record.current_semester, 10) || 5,
      specialization,
      cgpa,
      courses_enrolled: record.courses_enrolled || '',
      skills,
      advisor,
      attendance_percentage: parseInt(record.attendance_percentage, 10) || 80,
      fee_status: feeStatus,
      city: record.city || '',
      state: record.state || '',
      blood_group: record.blood_group || '',
      extracurricular_activity: record.extracurricular_activity || '',
      placement_status: placementStatus,
      company_placed: company,
      package_lpa: packageLpa
    };

    chunks.push({
      index: i - 1,
      text: profileText,
      page: Math.ceil(i / 10),
      metadata
    });
  }

  return chunks;
}

/**
 * Parses JSON array of students into semantic chunks
 */
function parseJSONToStudentRecords(jsonText) {
  const data = JSON.parse(jsonText);
  const students = Array.isArray(data) ? data : (data.students || data.records || [data]);
  const chunks = [];

  students.forEach((stu, idx) => {
    const studentName = stu.name || stu.student_name || stu.fullName || `Student ${idx + 1}`;
    const rollNo = stu.roll_no || stu.rollNo || stu.id || `CSE-${idx + 1}`;
    const specialization = stu.specialization || stu.department || 'Computer Science';
    const cgpa = parseFloat(stu.cgpa) || 0;
    const feeStatus = stu.fee_status || 'Standard';
    const placementStatus = stu.placement_status || 'Not Placed';
    const company = stu.company_placed || 'None';
    const packageLpa = parseFloat(stu.package_lpa) || 0;
    const skills = stu.skills || '';
    const advisor = stu.advisor || '';

    const profileText = stu.profile_text && stu.profile_text.length > 20
      ? stu.profile_text
      : `[STUDENT RECORD: ${studentName.toUpperCase()} (Roll No: ${rollNo})]\n` +
        `- Specialization: ${specialization}\n` +
        `- CGPA: ${cgpa}\n` +
        `- Skills: ${skills}\n` +
        `- Advisor: ${advisor}\n` +
        `- Fee Status: ${feeStatus}\n` +
        `- Placement: ${placementStatus} (${company !== 'None' ? company + ', ' + packageLpa + ' LPA' : 'Preparing'})\n` +
        `- Courses: ${stu.courses_enrolled || 'N/A'}`;

    const metadata = {
      student_id: stu.student_id || idx + 1,
      roll_no: rollNo,
      name: studentName,
      gender: stu.gender || 'Unspecified',
      age: stu.age || 20,
      email: stu.email || '',
      phone: stu.phone || '',
      enrollment_year: stu.enrollment_year || 2024,
      current_semester: stu.current_semester || 4,
      specialization,
      cgpa,
      courses_enrolled: stu.courses_enrolled || '',
      skills,
      advisor,
      attendance_percentage: stu.attendance_percentage || 80,
      fee_status: feeStatus,
      city: stu.city || '',
      state: stu.state || '',
      blood_group: stu.blood_group || '',
      extracurricular_activity: stu.extracurricular_activity || '',
      placement_status: placementStatus,
      company_placed: company,
      package_lpa: packageLpa
    };

    chunks.push({
      index: idx,
      text: profileText,
      page: Math.ceil((idx + 1) / 10),
      metadata
    });
  });

  return chunks;
}

/**
 * Generic text chunking with overlap
 */
function chunkText(text, chunkSize = 700, chunkOverlap = 150) {
  const clean = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ');
  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];

  let currentChunk = '';
  let approxPage = 1;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (trimmed.toLowerCase().includes('-- page') || trimmed.includes('\f')) {
      approxPage++;
    }

    if ((currentChunk.length + trimmed.length) < chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
    } else {
      if (currentChunk.length > 50) {
        chunks.push({
          text: currentChunk.trim(),
          page: approxPage
        });
      }
      const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
      currentChunk = currentChunk.slice(overlapStart) + '\n\n' + trimmed;
    }
  }

  if (currentChunk.trim().length > 30) {
    chunks.push({
      text: currentChunk.trim(),
      page: approxPage
    });
  }

  return chunks.map((c, i) => ({ ...c, index: i }));
}

/**
 * Vectorizes an array of chunk objects and stores them
 */
async function vectorizeChunks(rawChunks) {
  const embeddedChunks = [];
  rawChunks.forEach((c, idx) => {
    // Combine primary text + critical metadata for semantic richness
    const metadataStr = c.metadata 
      ? ` Skills: ${c.metadata.skills || ''} Specialization: ${c.metadata.specialization || ''} Advisor: ${c.metadata.advisor || ''}`
      : '';
    const fullSearchableText = c.text + metadataStr;

    embeddedChunks.push({
      index: idx,
      text: c.text,
      page: c.page || 1,
      metadata: c.metadata || {},
      embedding: generateTermVector(fullSearchableText)
    });
  });
  return embeddedChunks;
}

/**
 * Ingests Department Student Data into the permanent Vector DB
 */
async function ingestDepartmentData({ buffer, text, filename, title = 'Department Student Data', category = 'department_students' }) {
  console.log(`Ingesting department data: ${filename} (Category: ${category})`);
  let rawChunks = [];
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    const content = text || buffer.toString('utf8');
    rawChunks = parseCSVToStudentRecords(content);
  } else if (lowerName.endsWith('.json')) {
    const content = text || buffer.toString('utf8');
    rawChunks = parseJSONToStudentRecords(content);
  } else if (lowerName.endsWith('.pdf')) {
    const pdfData = await extractPDFText(buffer);
    rawChunks = chunkText(pdfData.text || '');
  } else {
    const content = text || buffer.toString('utf8');
    rawChunks = chunkText(content);
  }

  if (rawChunks.length === 0) {
    throw new Error('No valid student or departmental data records found in file.');
  }

  const embeddedChunks = await vectorizeChunks(rawChunks);
  const docId = `dept_doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const vectorDoc = {
    docId,
    title: title || filename,
    category,
    filename,
    chunkCount: embeddedChunks.length,
    chunks: embeddedChunks,
    createdAt: new Date().toISOString()
  };

  // 1. Keep in memory for instant queries
  departmentVectorStore.set(docId, vectorDoc);

  // 2. Persist in DB (Atlas or local)
  await db.saveVectorDoc(vectorDoc);

  console.log(`Successfully indexed ${embeddedChunks.length} student records into Department Vector Database.`);
  return {
    docId,
    title: vectorDoc.title,
    filename,
    chunkCount: embeddedChunks.length,
    category
  };
}

/**
 * Handles per-session document upload (PDF, CSV, JSON, TXT)
 */
async function processDocument(fileBuffer, originalFilename, sessionId) {
  console.log(`Processing file: ${originalFilename} for session: ${sessionId}`);
  const lowerName = originalFilename.toLowerCase();
  let rawChunks = [];
  let numPages = 1;

  if (lowerName.endsWith('.pdf')) {
    const pdfData = await extractPDFText(fileBuffer);
    numPages = pdfData.numpages || 1;
    rawChunks = chunkText(pdfData.text || '');
  } else if (lowerName.endsWith('.csv')) {
    rawChunks = parseCSVToStudentRecords(fileBuffer.toString('utf8'));
    numPages = Math.ceil(rawChunks.length / 10) || 1;
  } else if (lowerName.endsWith('.json')) {
    rawChunks = parseJSONToStudentRecords(fileBuffer.toString('utf8'));
    numPages = Math.ceil(rawChunks.length / 10) || 1;
  } else {
    rawChunks = chunkText(fileBuffer.toString('utf8'));
  }

  if (rawChunks.length === 0) {
    throw new Error('Could not extract meaningful content from this file.');
  }

  const embeddedChunks = await vectorizeChunks(rawChunks);

  const docMetadata = {
    sessionId,
    filename: originalFilename,
    pageCount: numPages,
    chunkCount: embeddedChunks.length,
    chunks: embeddedChunks,
    uploadedAt: new Date().toISOString()
  };

  sessionDocStore.set(sessionId, docMetadata);

  // Also index into global department store if student keywords present
  if (lowerName.includes('student') || lowerName.includes('dept') || lowerName.includes('roster')) {
    await ingestDepartmentData({
      buffer: fileBuffer,
      filename: originalFilename,
      title: `Department Student Roster (${originalFilename})`,
      category: 'department_students'
    }).catch(e => console.warn('Auto-index department warning:', e.message));
  }

  return {
    filename: originalFilename,
    pageCount: numPages,
    chunkCount: embeddedChunks.length
  };
}

/**
 * Matches structured metadata filters (e.g. fee_status == 'Scholarship', cgpa >= 8.5)
 */
function matchesMetadataFilter(metadata, filters) {
  if (!filters || Object.keys(filters).length === 0) return true;
  if (!metadata) return false;

  for (const [key, expected] of Object.entries(filters)) {
    if (expected === undefined || expected === null || expected === '') continue;

    if (key === 'minCgpa') {
      if ((metadata.cgpa || 0) < expected) return false;
      continue;
    }
    if (key === 'maxCgpa') {
      if ((metadata.cgpa || 0) > expected) return false;
      continue;
    }
    if (key === 'minPackage') {
      if ((metadata.package_lpa || 0) < expected) return false;
      continue;
    }
    if (key === 'skills') {
      const skillsStr = (metadata.skills || '').toLowerCase();
      const targetSkills = Array.isArray(expected) ? expected : [expected];
      const hasSkill = targetSkills.some(s => skillsStr.includes(s.toLowerCase()));
      if (!hasSkill) return false;
      continue;
    }

    const val = metadata[key];
    if (val === undefined) return false;

    if (typeof expected === 'string') {
      if (String(val).toLowerCase() !== expected.toLowerCase()) {
        // Also allow substring match for specializations or advisors
        if (!String(val).toLowerCase().includes(expected.toLowerCase())) {
          return false;
        }
      }
    } else if (val !== expected) {
      return false;
    }
  }

  return true;
}

/**
 * Searches top relevant chunks across both session-attached document AND the Department Vector DB
 * Supports hybrid vector retrieval + metadata filtering
 */
async function searchVectorStore(sessionId, queryText, options = {}) {
  const queryLower = queryText.toLowerCase();
  const isBroad = queryLower.includes('list') || queryLower.includes('all') || queryLower.includes('living in') || queryLower.includes('people') || queryLower.includes('students in') || queryLower.includes('who are in');
  const topK = options.topK || (isBroad ? 15 : 6);
  const minScore = options.minScore !== undefined ? options.minScore : 0.08;
  const filters = options.filters || {};

  const queryVec = generateTermVector(queryText);
  const queryTerms = queryLower.match(/\b[a-z0-9+#.]+\b/g) || [];

  const candidateChunks = [];

  // 1. Check Session Document
  const sessionDoc = sessionDocStore.get(sessionId);
  if (sessionDoc && sessionDoc.chunks) {
    sessionDoc.chunks.forEach(c => {
      candidateChunks.push({
        source: sessionDoc.filename,
        sourceType: 'session_doc',
        ...c
      });
    });
  }

  // 2. Check Global Department Vector Store
  departmentVectorStore.forEach(deptDoc => {
    if (deptDoc && deptDoc.chunks) {
      deptDoc.chunks.forEach(c => {
        candidateChunks.push({
          source: deptDoc.title || deptDoc.filename,
          sourceType: 'department_db',
          ...c
        });
      });
    }
  });

  if (candidateChunks.length === 0) {
    return { hasDocument: false, citations: [], contextString: '', totalIndexed: 0 };
  }

  // Apply metadata filter
  let filteredCandidates = candidateChunks;
  if (filters && Object.keys(filters).length > 0) {
    const strictMatches = candidateChunks.filter(c => matchesMetadataFilter(c.metadata, filters));
    if (strictMatches.length > 0) {
      filteredCandidates = strictMatches;
    }
  }

  // Calculate similarity + term bonus for student names/roll numbers/skills/cities
  const scored = filteredCandidates.map(chunk => {
    let score = cosineSimilarity(queryVec, chunk.embedding);
    
    // Keyword relevance bonus
    const textLower = (chunk.text || '').toLowerCase();
    const metaStr = JSON.stringify(chunk.metadata || {}).toLowerCase();
    const combined = textLower + ' ' + metaStr;

    let termMatches = 0;
    for (const term of queryTerms) {
      if (term.length > 2 && combined.includes(term)) {
        termMatches++;
        // Extra boost if term is exact name or roll number
        if (chunk.metadata?.name && chunk.metadata.name.toLowerCase().includes(term)) {
          score += 0.35;
        }
        if (chunk.metadata?.roll_no && chunk.metadata.roll_no.toLowerCase().includes(term)) {
          score += 0.50;
        }
        // Boost if matches city or state
        if (chunk.metadata?.city && chunk.metadata.city.toLowerCase() === term) {
          score += 0.45;
        }
        if (chunk.metadata?.state && chunk.metadata.state.toLowerCase() === term) {
          score += 0.35;
        }
        // Boost if matches specialization
        if (chunk.metadata?.specialization && chunk.metadata.specialization.toLowerCase().includes(term)) {
          score += 0.30;
        }
      }
    }
    if (termMatches > 0) {
      score += (termMatches * 0.12);
    }

    // Boost if matches requested filters
    if (matchesMetadataFilter(chunk.metadata, filters)) {
      score += 0.25;
    }

    return {
      source: chunk.source,
      chunkIndex: chunk.index,
      page: chunk.page,
      text: chunk.text,
      metadata: chunk.metadata || {},
      score: Math.round(score * 1000) / 1000
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.filter(c => c.score >= minScore).slice(0, topK);

  const contextString = topChunks.map(c => {
    const m = c.metadata;
    const header = m && m.name 
      ? `[STUDENT RECORD: ${m.name} | Roll No: ${m.roll_no || 'N/A'} | Spec: ${m.specialization || 'CS'} | CGPA: ${m.cgpa || 'N/A'} | Fee: ${m.fee_status || 'N/A'} | Placement: ${m.placement_status || 'N/A'} | Rel: ${(c.score * 100).toFixed(0)}%]`
      : `[SOURCE: ${c.source} | Ref: ${c.page ? 'Page ~' + c.page : 'Record #' + (c.chunkIndex + 1)} | Relevance: ${(c.score * 100).toFixed(0)}%]`;
    return `${header}\n${c.text}`;
  }).join('\n\n---\n\n');

  const mainFilename = sessionDoc ? sessionDoc.filename : (topChunks[0] ? topChunks[0].source : 'Department Student Database');

  return {
    hasDocument: topChunks.length > 0,
    filename: mainFilename,
    citations: topChunks,
    contextString,
    totalIndexed: candidateChunks.length
  };
}

function getActiveDocument(sessionId) {
  const doc = sessionDocStore.get(sessionId);
  if (!doc) return null;
  return {
    filename: doc.filename,
    pageCount: doc.pageCount,
    chunkCount: doc.chunkCount,
    uploadedAt: doc.uploadedAt
  };
}

function clearDocument(sessionId) {
  sessionDocStore.delete(sessionId);
}

function getDepartmentStats() {
  let count = 0;
  departmentVectorStore.forEach(doc => {
    count += (doc.chunks ? doc.chunks.length : 0);
  });
  return {
    documentsCount: departmentVectorStore.size,
    totalStudents: count
  };
}

/**
 * Finds a specific student metadata by name or roll number from department store
 */
function findStudentByNameOrRoll(query) {
  if (!query) return null;
  const q = query.toLowerCase();

  // 1. Search by exact or partial roll number
  const rollMatch = q.match(/\b(cse\d{8}|cse\d{4}|cse-\d+)\b/i);
  if (rollMatch) {
    const targetRoll = rollMatch[1].replace(/-/g, '').toLowerCase();
    for (const [_, doc] of departmentVectorStore) {
      if (!doc || !doc.chunks) continue;
      for (const chunk of doc.chunks) {
        const m = chunk.metadata;
        if (m && m.roll_no && m.roll_no.toLowerCase().replace(/-/g, '') === targetRoll) {
          return m;
        }
      }
    }
  }

  // 2. Search by student name
  let bestMatch = null;
  let maxLen = 0;

  for (const [_, doc] of departmentVectorStore) {
    if (!doc || !doc.chunks) continue;
    for (const chunk of doc.chunks) {
      const m = chunk.metadata;
      if (!m || !m.name) continue;
      const studentNameLower = m.name.toLowerCase();
      if (q.includes(studentNameLower) && studentNameLower.length > maxLen) {
        bestMatch = m;
        maxLen = studentNameLower.length;
      }
    }
  }

  return bestMatch;
}

// Load persisted vector documents on boot or auto-index default 200 CS students
async function initVectorStoreFromDB() {
  try {
    const docs = await db.getVectorDocs();
    if (docs && docs.length > 0) {
      docs.forEach(d => {
        departmentVectorStore.set(d.docId, d);
      });
      console.log(`📦 Loaded ${docs.length} department vector document collections from database (${getDepartmentStats().totalStudents} records).`);
    }
    
    // Auto-index default 200 students if no records loaded yet
    if (getDepartmentStats().totalStudents === 0) {
      const sampleCSV = path.join(__dirname, '..', 'sample_documents', 'computer_science_students.csv');
      if (fs.existsSync(sampleCSV)) {
        console.log('⚡ Auto-indexing 200 CS Students from sample_documents into Department Vector Store...');
        const buffer = fs.readFileSync(sampleCSV);
        await ingestDepartmentData({
          buffer,
          filename: 'computer_science_students.csv',
          title: 'Computer Science Department Student Database (200 Students)',
          category: 'department_students'
        });
      }
    }
  } catch (err) {
    console.warn('Notice loading vector documents from DB:', err.message);
  }
}

setTimeout(() => {
  initVectorStoreFromDB();
}, 500);

module.exports = {
  processDocument,
  processPDF: processDocument,
  ingestDepartmentData,
  searchVectorStore,
  getActiveDocument,
  clearDocument,
  getDepartmentStats,
  findStudentByNameOrRoll,
  initVectorStoreFromDB
};

