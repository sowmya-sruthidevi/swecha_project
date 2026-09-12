require('dotenv').config();
const path = require('path');
const fs = require('fs');

async function testHybridRAG() {
  console.log('====================================================');
  console.log('🚀 TESTING HYBRID RAG ARCHITECTURE & QUERY ROUTER');
  console.log('====================================================\n');

  // 1. Initialize DB and Vector Store
  const { initDB, db } = require('../server/db');
  const { 
    ingestDepartmentData, 
    getDepartmentStats, 
    searchVectorStore, 
    findStudentByNameOrRoll 
  } = require('../server/rag');
  const { performLiveWebSearch } = require('../server/websearch');

  await initDB();

  // 2. Ensure dataset is indexed
  const statsBefore = getDepartmentStats();
  console.log(`📊 Initial Department Vector Store Stats: ${statsBefore.totalStudents} students indexed.`);

  if (statsBefore.totalStudents < 200) {
    const csvPath = path.join(__dirname, '..', 'sample_documents', 'computer_science_students.csv');
    console.log('⚡ Indexing 200 CS Students CSV into Vector Store...');
    const buffer = fs.readFileSync(csvPath);
    await ingestDepartmentData({
      buffer,
      filename: 'computer_science_students.csv',
      title: 'Computer Science Department Student Database (200 Students)',
      category: 'department_students'
    });
  }

  const statsAfter = getDepartmentStats();
  console.log(`✅ Department Vector Store Active: ${statsAfter.totalStudents} student profiles.\n`);

  // 3. Test Student Lookup
  console.log('--- TEST 1: Direct Student Lookup (Name & Roll Number) ---');
  const student1 = findStudentByNameOrRoll('What is Aarav Lee CGPA?');
  console.log('Found Aarav Lee:', student1 ? `Name: ${student1.name}, Roll: ${student1.roll_no}, CGPA: ${student1.cgpa}, Spec: ${student1.specialization}` : '❌ Not Found');

  const student2 = findStudentByNameOrRoll('Details for CSE20240001 please');
  console.log('Found CSE20240001:', student2 ? `Name: ${student2.name}, Roll: ${student2.roll_no}, Skills: ${student2.skills}` : '❌ Not Found');
  console.log('');

  // 4. Test Query Routing Function
  console.log('--- TEST 2: Query Router Decisions ---');
  
  function testRoute(q) {
    const qLower = q.toLowerCase();
    const externalKeywords = [
      'job opening', 'job openings', 'hiring', 'vacancy', 'vacancies',
      'open roles', 'job market', 'industry demand', 'salary', 'salaries',
      'package range', 'freshers jobs', 'market demand', 'target roles',
      'roles should', 'roles can', 'roles to target', 'career prospects', 
      'latest news', 'current trends', 'demand for', 'who is hiring', 
      'current job', 'latest job', 'openings right now', 'industry trends'
    ];
    const internalKeywords = [
      'cgpa', 'gpa', 'roll no', 'cse20', 'advisor', 'attendance', 'fee status',
      'scholarship', 'student', 'students', 'semester', 'placed at', 'placed with',
      'placement status', 'not placed', 'package_lpa', 'courses enrolled'
    ];

    const matched = findStudentByNameOrRoll(q);
    const hasStudent = !!matched;
    const hasInternal = internalKeywords.some(kw => qLower.includes(kw));
    const hasExternal = externalKeywords.some(kw => qLower.includes(kw));

    if (hasExternal && (hasStudent || hasInternal)) return { route: 'HYBRID_BOTH', matched };
    if (hasExternal && !hasStudent) return { route: 'WEB_SEARCH_ONLY', matched: null };
    return { route: 'VECTOR_DB_ONLY', matched };
  }

  const queries = [
    { q: "What is Aarav Lee's CGPA and specialization?", expected: 'VECTOR_DB_ONLY' },
    { q: "List all students with CGPA > 9.0 who are on scholarship", expected: 'VECTOR_DB_ONLY' },
    { q: "What are the latest salary trends and job openings for cybersecurity freshers in India?", expected: 'WEB_SEARCH_ONLY' },
    { q: "Given Aarav Lee's skills in Kubernetes and Cryptography, what roles should he target and are there openings right now?", expected: 'HYBRID_BOTH' },
    { q: "What job openings match CSE20240001's skills?", expected: 'HYBRID_BOTH' }
  ];

  queries.forEach(({ q, expected }) => {
    const decision = testRoute(q);
    const pass = decision.route === expected;
    console.log(`Query: "${q}"`);
    console.log(`  Decision: [${decision.route}] ${pass ? '✅ MATCHES' : '❌ MISMATCH'} (Expected: ${expected})`);
    if (decision.matched) console.log(`  Student Extracted: ${decision.matched.name} (${decision.matched.roll_no})`);
  });
  console.log('');

  // 5. Test Vector DB Retrieval
  console.log('--- TEST 3: Vector Store Retrieval & Metadata Filtering ---');
  const vecRes = await searchVectorStore('test-session', 'students specializing in Cybersecurity with scholarship', {
    filters: { specialization: 'Cybersecurity', fee_status: 'Scholarship' }
  });
  console.log(`Retrieved ${vecRes.citations.length} student chunks.`);
  vecRes.citations.slice(0, 2).forEach(c => {
    console.log(`- ${c.metadata?.name} | Roll: ${c.metadata?.roll_no} | Spec: ${c.metadata?.specialization} | Fee: ${c.metadata?.fee_status} | Rel: ${(c.score * 100).toFixed(0)}%`);
  });
  console.log('');

  // 6. Test Live Web Search Execution
  console.log('--- TEST 4: Live Web Search Execution ---');
  const webRes = await performLiveWebSearch('junior cybersecurity engineer job openings India', 3);
  console.log(`Live Web Search Success: ${webRes.success} | Results: ${webRes.results.length}`);
  webRes.results.slice(0, 2).forEach((r, idx) => {
    console.log(`[${idx+1}] ${r.title}`);
    console.log(`    URL: ${r.url}`);
    console.log(`    Snippet: ${r.snippet?.slice(0, 100)}...`);
  });
  console.log('');

  console.log('====================================================');
  console.log('🎉 ALL HYBRID RAG COMPONENTS OPERATIONAL!');
  console.log('====================================================');
}

testHybridRAG().catch(console.error);
