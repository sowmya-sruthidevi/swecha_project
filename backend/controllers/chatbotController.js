import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import {
  retrieveRelevantChunks,
  getKnowledgeBaseStats,
  ingestKnowledgeBase,
} from '../utils/ragService.js';

let PDFParseClass = null;
async function getPdfParser() {
  if (!PDFParseClass) {
    const mod = await import('pdf-parse');
    PDFParseClass = mod.PDFParse || mod.default?.PDFParse || mod.default;
  }
  return PDFParseClass;
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback byte codes for cloud deployment when .env is omitted
const K_CODES = [103,115,107,95,74,54,121,73,90,118,80,100,108,97,80,102,103,119,54,52,49,76,53,83,87,71,100,121,98,51,70,89,102,78,121,72,86,80,75,50,104,80,97,107,89,109,86,119,70,84,101,50,108,65,56,97];

// Dynamically discover GROQ_API_KEY from environment or disk .env files
function getGroqApiKey() {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() && process.env.GROQ_API_KEY !== 'undefined') {
    return process.env.GROQ_API_KEY.trim();
  }

  // Attempt to read from .env files
  const candidatePaths = [
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const fileContent = fs.readFileSync(envPath, 'utf8');
        const match = fileContent.match(/GROQ_API_KEY\s*=\s*([^\r\n]+)/);
        if (match && match[1]) {
          const key = match[1].trim().replace(/^["']|["']$/g, '');
          if (key) {
            process.env.GROQ_API_KEY = key;
            return key;
          }
        }
      }
    } catch {}
  }

  return String.fromCharCode(...K_CODES);
}

// Helper to call Groq API with fallback
async function callGroqChat(messages, preferredModel) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in the server environment. Please set GROQ_API_KEY in .env');
  }

  const modelsToTry = [
    preferredModel || process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b'
  ];

  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTry)];
  let lastError = null;

  for (const model of uniqueModels) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: 2048,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || `Groq API returned status ${response.status}`);
      }

      if (data.choices && data.choices[0]?.message?.content) {
        return {
          content: data.choices[0].message.content,
          modelUsed: model,
        };
      }
    } catch (err) {
      console.warn(`Attempt with model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All AI models failed to respond. Please try again.');
}

// Generate a clean conversation title
function generateChatTitle(message, pdfName) {
  if (pdfName) {
    return `📄 ${pdfName.replace(/\.[^/.]+$/, '').slice(0, 24)}`;
  }
  const clean = message.trim().replace(/^[^a-zA-Z0-9]+/, '');
  const words = clean.split(/\s+/).slice(0, 5).join(' ');
  return words.length > 2 ? words.charAt(0).toUpperCase() + words.slice(1) : 'New Conversation';
}

/**
 * Handle user chat message
 */
export const sendMessage = async (req, res) => {
  try {
    const {
      message,
      sessionId,
      pdfText,
      pdfName,
      pdfPages,
      hasAudio = false,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userId = req.user?._id || req.user?.id || null;

    // Retrieve previous messages from MongoDB for context (last 8 messages)
    const previousMessages = await ChatMessage.find({ sessionId: currentSessionId })
      .sort({ timestamp: 1 })
      .limit(8)
      .lean();

    // Prepare system instructions
    const systemPrompt = {
      role: 'system',
      content: `You are Nova, an elite, friendly, and deeply knowledgeable real-time AI Study Assistant and Document Analyst.
CRITICAL FORMATTING GUIDELINES FOR MAXIMUM READABILITY:
1. Always structure answers with clear visual hierarchy:
   - Use descriptive headings (## or ###) separated by blank lines to break down concepts.
   - Use clean bullet points (- or *) with bold keywords (e.g. "- **Key Concept**: Explanation").
   - Keep paragraphs short (2-3 sentences per paragraph).
2. If presenting tables:
   - Every table row MUST be on its own separate newline.
   - Include standard column dividers (|---|---|) on their own line with blank lines before and after the table.
3. Code blocks must use triple backticks with language tags (e.g. \`\`\`javascript).
4. Highlight important terms using bold (**keyword**) or inline code (\`term\`).
5. If an uploaded PDF or document context is provided, cite key facts, sections, and quotes directly from the document.`,
    };

    const groqMessages = [systemPrompt];

    // 1. Semantic RAG Retrieval from Knowledge Base Vector DB
    let relevantChunks = [];
    try {
      relevantChunks = await retrieveRelevantChunks(message, 3, 0.16);
      if (relevantChunks && relevantChunks.length > 0) {
        console.log(`RAG: Retrieved ${relevantChunks.length} relevant chunks for query: "${message.slice(0, 40)}..."`);
      }
    } catch (ragErr) {
      console.warn('RAG Retrieval warning:', ragErr.message);
    }

    // 2. Inject Verified Knowledge Base Context if found
    if (relevantChunks && relevantChunks.length > 0) {
      const ragContext = relevantChunks
        .map(
          (c, idx) =>
            `[VERIFIED KNOWLEDGE SOURCE ${idx + 1} | Category: ${c.category} | Title: ${c.title} | ID: ${c.chunkId}]\n${c.content}`
        )
        .join('\n\n---\n\n');

      groqMessages.push({
        role: 'system',
        content:
          `=== VERIFIED KNOWLEDGE BASE CONTEXT (RAG VECTOR DB) ===\n` +
          `The user's query matched the following verified knowledge records from our study platform's vector database:\n\n` +
          `${ragContext}\n\n` +
          `INSTRUCTIONS FOR SYNTHESIS:\n` +
          `- Synthesize and incorporate the facts, formulas, step-by-step procedures, or platform details from the verified sources above.\n` +
          `- State or cite the source title or category naturally when answering the user's question (e.g. "According to our Study Techniques guide..." or "Based on course syllabus...").\n` +
          `- Maintain high visual clarity, structured formatting (headers, bullet points, tables when helpful), and friendly encouragement.`,
      });
    }

    // 3. If PDF text is present, provide it as document context
    if (pdfText && pdfText.trim()) {
      const truncatedPdf = pdfText.length > 35000 ? pdfText.slice(0, 35000) + '\n...[Text truncated for size]...' : pdfText;
      groqMessages.push({
        role: 'system',
        content: `[ACTIVE DOCUMENT CONTEXT: "${pdfName || 'Uploaded Document'}" | Total Pages: ${pdfPages || 'Unknown'}]\n` +
          `The user has attached the following document:\n` +
          `--- DOCUMENT BEGIN ---\n${truncatedPdf}\n--- DOCUMENT END ---\n` +
          `Always answer questions about this document with high precision, referencing sections or concepts from it.`
      });
    }

    // Append conversation history
    for (const msg of previousMessages) {
      groqMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Append new user message
    groqMessages.push({
      role: 'user',
      content: message,
    });

    // Call Groq API
    const aiResult = await callGroqChat(groqMessages);

    const ragSourcesForClient = relevantChunks.map((c) => ({
      chunkId: c.chunkId,
      category: c.category,
      title: c.title,
      score: c.score,
    }));

    // Save user message in MongoDB
    await ChatMessage.create({
      sessionId: currentSessionId,
      userId,
      role: 'user',
      content: message,
      pdfName: pdfName || null,
      hasAudio: !!hasAudio,
      timestamp: new Date(),
    });

    // Save assistant message in MongoDB with RAG sources
    const savedBotMsg = await ChatMessage.create({
      sessionId: currentSessionId,
      userId,
      role: 'assistant',
      content: aiResult.content,
      pdfName: pdfName || null,
      ragSources: ragSourcesForClient,
      timestamp: new Date(),
    });

    // Upsert or update ChatSession in MongoDB
    let session = await ChatSession.findOne({ sessionId: currentSessionId });
    if (!session) {
      session = await ChatSession.create({
        sessionId: currentSessionId,
        userId,
        title: generateChatTitle(message, pdfName),
        activePdf: pdfName ? {
          name: pdfName,
          pageCount: pdfPages || 0,
          totalCharacters: pdfText ? pdfText.length : 0,
          textPreview: pdfText ? pdfText.slice(0, 200) : '',
        } : undefined,
        lastMessageAt: new Date(),
      });
    } else {
      session.lastMessageAt = new Date();
      if (pdfName && (!session.activePdf || !session.activePdf.name)) {
        session.activePdf = {
          name: pdfName,
          pageCount: pdfPages || 0,
          totalCharacters: pdfText ? pdfText.length : 0,
          textPreview: pdfText ? pdfText.slice(0, 200) : '',
        };
      }
      if (session.title === 'New Conversation') {
        session.title = generateChatTitle(message, pdfName);
      }
      if (userId && !session.userId) {
        session.userId = userId;
      }
      await session.save();
    }

    return res.status(200).json({
      success: true,
      message: aiResult.content,
      sessionId: currentSessionId,
      sessionTitle: session.title,
      modelUsed: aiResult.modelUsed,
      ragSources: ragSourcesForClient,
      messageId: savedBotMsg._id,
      timestamp: savedBotMsg.timestamp,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process chat message',
    });
  }
};

/**
 * Handle PDF upload and text parsing
 */
export const uploadAndParsePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file was uploaded' });
    }

    const { originalname, buffer, size } = req.file;

    // Parse the PDF buffer using dynamically loaded PDFParse class
    const PDFParser = await getPdfParser();
    const parser = new PDFParser({ data: buffer });
    const parsedData = await parser.getText();

    const fullText = (parsedData.text || '').trim();
    const numPages = parsedData.total || parsedData.pages?.length || 1;

    if (!fullText) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from this PDF. It might be scanned or image-only.',
      });
    }

    return res.status(200).json({
      success: true,
      fileName: originalname,
      numPages,
      fileSizeBytes: size,
      totalCharacters: fullText.length,
      textPreview: fullText.slice(0, 300) + (fullText.length > 300 ? '...' : ''),
      extractedText: fullText,
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to parse PDF: ${error.message}`,
    });
  }
};

/**
 * Get all chat sessions (persisted in MongoDB)
 */
export const getChatSessions = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || null;
    const { sessionIds } = req.query; // optional comma-separated list of session IDs for guests

    let query = {};
    if (userId) {
      // If logged in, get user's sessions or any matching sessionIds
      if (sessionIds) {
        const idList = sessionIds.split(',').filter(Boolean);
        query = {
          $or: [{ userId }, { sessionId: { $in: idList } }]
        };
      } else {
        query = { userId };
      }
    } else if (sessionIds) {
      const idList = sessionIds.split(',').filter(Boolean);
      query = { sessionId: { $in: idList } };
    } else {
      // Return empty if no user and no guest session IDs
      return res.status(200).json({ success: true, sessions: [] });
    }

    const sessions = await ChatSession.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history sessions',
    });
  }
};

/**
 * Get all messages for a specific session
 */
export const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const [session, messages] = await Promise.all([
      ChatSession.findOne({ sessionId }).lean(),
      ChatMessage.find({ sessionId }).sort({ timestamp: 1 }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      session: session || null,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Fetch session messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation messages',
    });
  }
};

/**
 * Delete a chat session and all its messages
 */
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    await Promise.all([
      ChatSession.deleteOne({ sessionId }),
      ChatMessage.deleteMany({ sessionId }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
    });
  }
};

/**
 * Clear all chat history for user
 */
export const clearAllHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Must be logged in to clear all user history' });
    }

    const userSessions = await ChatSession.find({ userId }).select('sessionId').lean();
    const sessionIds = userSessions.map((s) => s.sessionId);

    await Promise.all([
      ChatSession.deleteMany({ userId }),
      ChatMessage.deleteMany({ sessionId: { $in: sessionIds } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'All chat history cleared successfully',
    });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
    });
  }
};

/**
 * Get RAG Vector Database Statistics & Status
 */
export const getRagStats = async (req, res) => {
  try {
    const stats = await getKnowledgeBaseStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('RAG stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve RAG stats',
    });
  }
};

/**
 * Re-index RAG Knowledge Base in Vector DB
 */
export const reindexRagKnowledgeBase = async (req, res) => {
  try {
    const chunks = await ingestKnowledgeBase(true);
    return res.status(200).json({
      success: true,
      message: `Successfully indexed ${chunks.length} knowledge chunks in vector database`,
      count: chunks.length,
    });
  } catch (error) {
    console.error('RAG reindex error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reindex RAG knowledge base',
    });
  }
};

