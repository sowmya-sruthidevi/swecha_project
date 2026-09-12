const express = require('express');
const router = express.Router();
const multer = require('multer');
const OpenAI = require('openai');
const { db } = require('../db');
const { getAIConfig, getAIStatus } = require('../ai_config');
const { processPDF, searchVectorStore, getActiveDocument, clearDocument, findStudentByNameOrRoll } = require('../rag');
const { performLiveWebSearch } = require('../websearch');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

const aiConfig = getAIConfig();
const apiKey = aiConfig.apiKey;
const isGroq = aiConfig.isGroq;
const aiClient = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined
    })
  : null;

console.log(`🤖 AI Engine Provider: ${aiConfig.ready ? (isGroq ? 'Groq Cloud (Ultra-Fast Inference)' : 'OpenAI') : 'Not configured'}`);
console.log(`🧪 AI Status: ${getAIStatus().message}`);

// GET all sessions for authenticated user
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await db.getSessions(req.user.id);
    res.json({ sessions });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// CREATE a new session
router.post('/sessions', async (req, res) => {
  try {
    const { title, model } = req.body;
    const session = await db.createSession(req.user.id, title || 'New Conversation', model || 'gpt-4o-mini');
    res.status(201).json({ session });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET specific session and its full message history
router.get('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await db.getSession(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const messages = await db.getMessages(sessionId);
    const activeDoc = getActiveDocument(sessionId);
    res.json({ session, messages, activeDoc });
  } catch (err) {
    console.error('Error fetching session details:', err);
    res.status(500).json({ error: 'Failed to retrieve session details' });
  }
});

// UPDATE session (e.g., rename title)
router.patch('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { title } = req.body;
    const updated = await db.updateSession(sessionId, req.user.id, { title });
    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ session: updated });
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    await db.deleteSession(sessionId, req.user.id);
    clearDocument(sessionId);
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// UPLOAD DOCUMENT (PDF, CSV, JSON, TXT) for RAG in a session
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const sessionId = req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const lowerName = req.file.originalname.toLowerCase();
    const validExtensions = ['.pdf', '.csv', '.json', '.txt', '.md'];
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      return res.status(400).json({ error: 'Supported formats for RAG indexing: PDF, CSV, JSON, and TXT.' });
    }

    // Process and index document chunks into vector embeddings
    const docInfo = await processDocument(req.file.buffer, req.file.originalname, sessionId);

    // Update session record
    await db.updateSession(sessionId, req.user.id, {
      activeDocument: {
        filename: docInfo.filename,
        pageCount: docInfo.pageCount,
        chunkCount: docInfo.chunkCount,
        uploadedAt: new Date().toISOString()
      }
    });

    res.json({
      message: `${req.file.originalname} analyzed and vector indexed successfully!`,
      document: docInfo
    });
  } catch (err) {
    console.error('Error processing document upload:', err);
    res.status(500).json({ error: err.message || 'Failed to process and index document' });
  }
});

// DEDICATED INGESTION FOR DEPARTMENT STUDENT DATA
router.post('/ingest/students', upload.single('file'), async (req, res) => {
  try {
    const { ingestDepartmentData } = require('../rag');
    let buffer, filename, title;

    if (req.file) {
      buffer = req.file.buffer;
      filename = req.file.originalname;
      title = req.body.title || `Student Department Data (${filename})`;
    } else if (req.body.students) {
      const jsonStr = typeof req.body.students === 'string' ? req.body.students : JSON.stringify(req.body.students);
      buffer = Buffer.from(jsonStr, 'utf8');
      filename = 'students_roster.json';
      title = req.body.title || 'Department Student Records';
    } else {
      return res.status(400).json({ error: 'Provide a file (PDF, CSV, JSON) or a students JSON array in body.' });
    }

    const result = await ingestDepartmentData({
      buffer,
      filename,
      title,
      category: 'department_students'
    });

    res.json({
      success: true,
      message: `Successfully ingested ${result.chunkCount} student record chunks into the Department Vector Database!`,
      details: result
    });
  } catch (err) {
    console.error('Error ingesting student data:', err);
    res.status(500).json({ error: err.message || 'Failed to ingest department student data' });
  }
});

// REMOVE active document from session
router.delete('/sessions/:id/document', async (req, res) => {
  try {
    const sessionId = req.params.id;
    clearDocument(sessionId);
    await db.updateSession(sessionId, req.user.id, { activeDocument: null });
    res.json({ success: true, message: 'Document detached from session' });
  } catch (err) {
    console.error('Error clearing document:', err);
    res.status(500).json({ error: 'Failed to clear document' });
  }
});


/**
 * Classifies an incoming query to determine the optimal retrieval route:
 * 1. VECTOR_DB_ONLY: Internal student facts, CGPA, courses, advisors, placement
 * 2. WEB_SEARCH_ONLY: Live market conditions, current tech news, general job market
 * 3. HYBRID_BOTH: Internal student profile combined with real-time job market/openings
 */
function classifyQueryRoute(message, hasActiveDoc = false) {
  const q = message.toLowerCase();

  // Keywords that signal external/live web search intent
  const externalKeywords = [
    'job opening', 'job openings', 'hiring', 'vacancy', 'vacancies',
    'open roles', 'job market', 'industry demand', 'salary', 'salaries',
    'package range', 'freshers jobs', 'market demand', 'target roles',
    'roles should', 'roles can', 'roles to target', 'career prospects', 
    'latest news', 'current trends', 'demand for', 'who is hiring', 
    'current job', 'latest job', 'openings right now', 'industry trends',
    'market benchmark', 'fresher opening', 'open positions', 'hiring now',
    'what companies are hiring'
  ];

  // Keywords that signal internal academic/student data
  const internalKeywords = [
    'cgpa', 'gpa', 'roll no', 'cse20', 'advisor', 'attendance', 'fee status',
    'scholarship', 'student', 'students', 'semester', 'placed at', 'placed with',
    'placement status', 'not placed', 'package_lpa', 'courses enrolled',
    'department records', 'profile_text', 'who has highest', 'who has lowest',
    'student data', 'student records', 'department', 'vijayawada', 'hyderabad',
    'bengaluru', 'chennai', 'pune', 'delhi', 'mumbai', 'kolkata', 'kochi',
    'visakhapatnam', 'living in', 'based in', 'people living', 'state', 'city'
  ];

  const matchedStudent = findStudentByNameOrRoll ? findStudentByNameOrRoll(message) : null;
  const hasStudentNameOrRoll = !!matchedStudent;
  const hasInternalKeywords = internalKeywords.some(kw => q.includes(kw)) || hasActiveDoc;
  const hasExternalKeywords = externalKeywords.some(kw => q.includes(kw));

  // Case 1: Hybrid - Both student identification and market/job openings
  if (hasExternalKeywords && (hasStudentNameOrRoll || hasInternalKeywords)) {
    return {
      route: 'HYBRID_BOTH',
      matchedStudent,
      reason: 'Bridges student profile with live external job openings and career trends'
    };
  }

  // Case 2: External Only - Live job market, industry demand, salaries without specific student
  if (hasExternalKeywords && !hasStudentNameOrRoll) {
    return {
      route: 'WEB_SEARCH_ONLY',
      matchedStudent: null,
      reason: 'External real-time information or industry demand query'
    };
  }

  // Case 3: Vector DB Only - Internal student details, CGPA, courses, advisors
  return {
    route: 'VECTOR_DB_ONLY',
    matchedStudent,
    reason: 'Internal student database / academic record inquiry'
  };
}

// CHAT COMPLETION with Intelligent Hybrid RAG Routing
router.post('/chat', async (req, res) => {
  try {
    let { sessionId, message, hasAudio, model = 'gpt-4o-mini' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const userId = req.user?.id || 'guest_user';

    // Auto-create session if none provided or active
    if (!sessionId) {
      const newSession = await db.createSession(userId, message.trim().slice(0, 32), model);
      sessionId = newSession.id || newSession._id;
    }

    if (!apiKey || !aiClient) {
      const healthMessage = 'The chatbot is not connected to a valid AI provider. Please add a valid GROQ_API_KEY or OPENAI_API_KEY in the .env file before sending chat requests.';
      const errorResponse = {
        sessionId,
        message: {
          id: `msg_${Date.now()}`,
          sessionId,
          role: 'assistant',
          content: healthMessage,
          citations: [],
          route: 'AI_NOT_CONFIGURED',
          createdAt: new Date().toISOString()
        },
        citations: [],
        route: 'AI_NOT_CONFIGURED',
        routeReason: 'AI provider not configured',
        hasDocument: false,
        documentName: 'AI Not Configured'
      };
      await db.addMessage({
        sessionId,
        role: 'user',
        content: message.trim(),
        hasAudio: !!hasAudio
      });
      await db.addMessage({
        sessionId,
        role: 'assistant',
        content: healthMessage,
        citations: [],
        route: 'AI_NOT_CONFIGURED'
      });
      return res.status(503).json(errorResponse);
    }

    // 1. Save user message to database
    await db.addMessage({
      sessionId,
      role: 'user',
      content: message.trim(),
      hasAudio: !!hasAudio
    });

    // 2. Fetch past conversation messages for context window (last 10 messages)
    const allHistory = await db.getMessages(sessionId);
    const recentHistory = allHistory.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Auto-update session title if it is the first user query
    if (allHistory.filter(m => m.role === 'user').length <= 1) {
      const generatedTitle = message.trim().slice(0, 32) + (message.length > 32 ? '...' : '');
      await db.updateSession(sessionId, req.user.id, { title: generatedTitle });
    }

    // 3. Intelligent Query Routing
    const hasActiveDoc = !!getActiveDocument(sessionId);
    const routeInfo = classifyQueryRoute(message, hasActiveDoc);
    console.log(`🧭 Query Route: [${routeInfo.route}] - ${routeInfo.reason}`);

    let unifiedCitations = [];
    let studentContextString = '';
    let webContextString = '';

    // ROUTE 1: VECTOR_DB_ONLY
    if (routeInfo.route === 'VECTOR_DB_ONLY') {
      try {
        const ragResult = await searchVectorStore(sessionId, message);
        studentContextString = ragResult.contextString;

        if (ragResult.citations && ragResult.citations.length > 0) {
          unifiedCitations = ragResult.citations.map(c => ({
            type: 'student_record',
            sourceType: 'student_db',
            title: c.metadata?.name ? `${c.metadata.name} (${c.metadata.roll_no || ''})` : (c.source || 'Department Database'),
            roll_no: c.metadata?.roll_no,
            specialization: c.metadata?.specialization,
            cgpa: c.metadata?.cgpa,
            page: c.page,
            score: c.score,
            text: c.text
          }));
        } else if (routeInfo.matchedStudent) {
          const s = routeInfo.matchedStudent;
          studentContextString = `[STUDENT RECORD: ${s.name} | Roll No: ${s.roll_no} | Spec: ${s.specialization} | CGPA: ${s.cgpa} | Fee: ${s.fee_status} | Placement: ${s.placement_status} (${s.company_placed})]\n${s.profile_text || ''}`;
          unifiedCitations.push({
            type: 'student_record',
            sourceType: 'student_db',
            title: `${s.name} (${s.roll_no})`,
            roll_no: s.roll_no,
            specialization: s.specialization,
            cgpa: s.cgpa,
            score: 0.98,
            text: s.profile_text || `Student ${s.name} specializing in ${s.specialization} with CGPA ${s.cgpa}.`
          });
        }
      } catch (embErr) {
        console.warn('Vector search notice:', embErr.message);
      }
    }

    // ROUTE 2: WEB_SEARCH_ONLY
    else if (routeInfo.route === 'WEB_SEARCH_ONLY') {
      try {
        const webResult = await performLiveWebSearch(message, 4);
        webContextString = webResult.contextString;
        if (webResult.results && webResult.results.length > 0) {
          unifiedCitations = webResult.results.map((r, idx) => ({
            type: 'web_source',
            sourceType: 'live_web',
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            source: r.source || 'Live Web',
            score: Math.round((0.95 - idx * 0.05) * 100) / 100,
            text: `${r.title}\n${r.snippet}\nLink: ${r.url}`
          }));
        }
      } catch (webErr) {
        console.warn('Web search notice:', webErr.message);
      }
    }

    // ROUTE 3: HYBRID_BOTH
    else if (routeInfo.route === 'HYBRID_BOTH') {
      let targetStudent = routeInfo.matchedStudent;

      // Step A: Pull internal student record from Vector DB
      try {
        const ragResult = await searchVectorStore(sessionId, message);
        studentContextString = ragResult.contextString;

        if (ragResult.citations && ragResult.citations.length > 0) {
          ragResult.citations.forEach(c => {
            unifiedCitations.push({
              type: 'student_record',
              sourceType: 'student_db',
              title: c.metadata?.name ? `${c.metadata.name} (${c.metadata.roll_no || ''})` : (c.source || 'Department Database'),
              roll_no: c.metadata?.roll_no,
              specialization: c.metadata?.specialization,
              cgpa: c.metadata?.cgpa,
              page: c.page,
              score: c.score,
              text: c.text
            });
          });
          if (!targetStudent && ragResult.citations[0]?.metadata?.name) {
            targetStudent = ragResult.citations[0].metadata;
          }
        } else if (targetStudent) {
          studentContextString = `[STUDENT RECORD: ${targetStudent.name} | Roll No: ${targetStudent.roll_no} | Spec: ${targetStudent.specialization} | CGPA: ${targetStudent.cgpa} | Fee: ${targetStudent.fee_status} | Placement: ${targetStudent.placement_status} (${targetStudent.company_placed})]\n${targetStudent.profile_text || ''}`;
          unifiedCitations.push({
            type: 'student_record',
            sourceType: 'student_db',
            title: `${targetStudent.name} (${targetStudent.roll_no})`,
            roll_no: targetStudent.roll_no,
            specialization: targetStudent.specialization,
            cgpa: targetStudent.cgpa,
            score: 0.98,
            text: targetStudent.profile_text || `Student ${targetStudent.name} specializing in ${targetStudent.specialization} with CGPA ${targetStudent.cgpa}.`
          });
        }
      } catch (e) {
        console.warn('Hybrid vector search notice:', e.message);
      }

      // Step B: Formulate targeted live job/market search query
      let targetedQuery = message;
      if (targetStudent) {
        const topSkills = (targetStudent.skills || '').split(';').slice(0, 3).map(s => s.trim()).join(' ');
        const spec = targetStudent.specialization || 'Computer Science';
        targetedQuery = `${spec} ${topSkills} junior fresher jobs openings India 2026`;
      }

      // Step C: Execute targeted live web search
      try {
        const webResult = await performLiveWebSearch(targetedQuery, 4);
        webContextString = webResult.contextString;
        if (webResult.results && webResult.results.length > 0) {
          webResult.results.forEach((r, idx) => {
            unifiedCitations.push({
              type: 'web_source',
              sourceType: 'live_web',
              title: r.title,
              url: r.url,
              snippet: r.snippet,
              source: r.source || 'Live Web Search',
              score: Math.round((0.92 - idx * 0.05) * 100) / 100,
              text: `${r.title}\n${r.snippet}\nLink: ${r.url}`
            });
          });
        }
      } catch (e) {
        console.warn('Hybrid web search notice:', e.message);
      }
    }

    // 4. Construct Grounded System Prompt
    let systemPrompt = `You are Nexus AI, an expert Academic & Career AI Advisor.
You have access to internal Computer Science & Engineering department records and live external web intelligence.

CORE BEHAVIOR RULES:
1. GROUNDED FACTUALITY:
   - When [INTERNAL DEPARTMENT RECORDS] are provided: strictly ground your answers in these student records. Quote exact names, roll numbers, CGPAs, coursework, technical skills, faculty advisors, and placement status. Never invent student facts.
   - When [LIVE WEB SEARCH & JOB MARKET DATA] are provided: synthesize real-world hiring trends, salaries, matching job titles, and cite source titles and URLs.
   - In HYBRID RAG MODE:
     * First analyze the student's unique academic profile, specialization, coursework, and technical skills from the internal record.
     * Then bridge them directly with live industry demand and current job openings retrieved from the web search.
     * Recommend specific target job titles, highlighted matching skills, gap areas, and concrete preparation steps.
2. FORMATTING: Use clean, beautiful Markdown formatting with bold headers, bullet points, clean tables, and code blocks with language tags where appropriate.
3. If no relevant records or web results are found, answer with general technical knowledge clearly without hallucinating internal records.`;

    if (studentContextString) {
      systemPrompt += `\n\n--- INTERNAL DEPARTMENT RECORDS ---\n${studentContextString}\n--- END INTERNAL RECORDS ---`;
    }

    if (webContextString) {
      systemPrompt += `\n\n--- LIVE WEB SEARCH & JOB MARKET DATA ---\n${webContextString}\n--- END WEB DATA ---`;
    }

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory
    ];

    // 5. Query AI Client (Groq or OpenAI)
    let targetModel = model;
    if (isGroq) {
      if (!targetModel || targetModel.includes('gpt-4o') || targetModel.includes('gpt-oss-120b')) {
        targetModel = 'openai/gpt-oss-120b';
      } else if (targetModel.includes('qwen') || targetModel.includes('fast')) {
        targetModel = 'qwen/qwen3.8-27b';
      } else {
        targetModel = 'openai/gpt-oss-120b';
      }
    } else {
      targetModel = model || 'gpt-4o-mini';
    }

    console.log(`Sending chat completion request (model: ${targetModel}, route: ${routeInfo.route})...`);
    let assistantContent = '';
    
    try {
      const completion = await aiClient.chat.completions.create({
        model: targetModel,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000
      });
      assistantContent = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    } catch (apiErr) {
      console.warn('AI API Call Exception:', apiErr.message);
      
      // If request too large (413) or TPM limit on 120b, auto-retry with high-throughput model qwen3.8
      if ((apiErr.status === 413 || apiErr.message.includes('too large') || apiErr.message.includes('TPM') || apiErr.message.includes('Limit 8000')) && targetModel !== 'qwen/qwen3.8-27b') {
        try {
          console.log('Retrying with high-throughput model qwen/qwen3.8-27b...');
          const fallbackComp = await aiClient.chat.completions.create({
            model: 'qwen/qwen3.8-27b',
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 2000
          });
          assistantContent = fallbackComp.choices[0]?.message?.content || '';
        } catch (retryErr) {
          console.error('Fallback model error:', retryErr.message);
        }
      }

      if (!assistantContent) {
        if (studentContextString) {
          assistantContent = `> [!NOTE]\n> **Notice**: Retrieved from Internal Department Records:\n\n` +
            `${studentContextString.slice(0, 1000)}`;
        } else if (webContextString) {
          assistantContent = `> [!NOTE]\n> **Notice**: Retrieved from Live Web Search:\n\n` +
            `${webContextString.slice(0, 1000)}`;
        } else {
          assistantContent = `> [!NOTE]\n> **Notice**: API rate limit reached.\n\n` +
            `Received query: **"${message.replace(/"/g, '')}"**.`;
        }
      }
    }

    // 6. Save assistant message with citations and route to DB
    const savedMessage = await db.addMessage({
      sessionId,
      role: 'assistant',
      content: assistantContent,
      citations: unifiedCitations,
      route: routeInfo.route
    });

    // 7. Return response
    res.json({
      sessionId,
      message: savedMessage,
      citations: unifiedCitations,
      route: routeInfo.route,
      routeReason: routeInfo.reason,
      hasDocument: unifiedCitations.length > 0,
      documentName: routeInfo.route === 'WEB_SEARCH_ONLY' ? 'Live Web Search' : (routeInfo.route === 'HYBRID_BOTH' ? 'Hybrid (Student DB + Web Search)' : 'Department Student Database')
    });

  } catch (err) {
    console.error('Chat completion error:', err);
    res.status(500).json({ error: err.message || 'Error generating AI response' });
  }
});

// WHISPER AUDIO TRANSCRIPTION (Server-side fallback for audio files)
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { toFile } = require('openai');
    const audioFile = await toFile(req.file.buffer, 'recording.webm', { type: req.file.mimetype || 'audio/webm' });
    const whisperModel = isGroq ? 'whisper-large-v3-turbo' : 'whisper-1';

    const transcription = await aiClient.audio.transcriptions.create({
      file: audioFile,
      model: whisperModel
    });

    res.json({ text: transcription.text });
  } catch (err) {
    console.error('Whisper transcription error:', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

module.exports = router;
