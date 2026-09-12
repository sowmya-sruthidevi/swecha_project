import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  UploadCloud,
  X,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Clock,
  Menu,
  ChevronRight,
  Download,
} from 'lucide-react';
import { chatbotApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ChatbotPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Session & Message State
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('nova_active_session_id') || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  });
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // PDF State
  const [activePdf, setActivePdf] = useState(null); // { name, numPages, fullText, totalCharacters }
  const [pdfUploading, setPdfUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('nova_voice_enabled') === 'true';
  });
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const recognitionRef = useRef(null);

  // Copy state
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Persist voice toggle
  useEffect(() => {
    localStorage.setItem('nova_voice_enabled', String(voiceEnabled));
  }, [voiceEnabled]);

  // Load chat sessions from MongoDB
  const loadSessions = useCallback(async () => {
    try {
      // Collect local guest session IDs
      const localGuestIds = JSON.parse(localStorage.getItem('nova_guest_sessions') || '[]');
      const queryParams = localGuestIds.length ? { sessionIds: localGuestIds.join(',') } : {};

      const res = await chatbotApi.getSessions(queryParams);
      if (res.data?.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  }, []);

  // Load active session messages
  const loadSessionMessages = useCallback(async (sid) => {
    try {
      setLoading(true);
      const res = await chatbotApi.getSessionMessages(sid);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
        if (res.data.session?.activePdf?.name) {
          setActivePdf({
            name: res.data.session.activePdf.name,
            numPages: res.data.session.activePdf.pageCount,
            fullText: res.data.session.activePdf.textPreview || '',
            totalCharacters: res.data.session.activePdf.totalCharacters || 0,
          });
        } else {
          setActivePdf(null);
        }
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSessions();
    if (sessionId) {
      loadSessionMessages(sessionId);
    }
  }, [loadSessions, sessionId, loadSessionMessages]);

  // Save guest session IDs
  const trackSessionId = (sid) => {
    if (!user) {
      const existing = JSON.parse(localStorage.getItem('nova_guest_sessions') || '[]');
      if (!existing.includes(sid)) {
        existing.unshift(sid);
        localStorage.setItem('nova_guest_sessions', JSON.stringify(existing.slice(0, 30)));
      }
    }
  };

  // Web Speech API: Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechInterim('');
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setInputMessage((prev) => (prev ? `${prev} ${final}` : final));
          setSpeechInterim('');
        } else {
          setSpeechInterim(interim);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechInterim('');
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow mic access in your browser.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechInterim('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Voice Assistant: Toggle Speech Recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser. Try Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis?.cancel();
        setSpeakingMessageId(null);
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  // Voice Assistant: Text-to-Speech (speak bot message)
  const speakText = (text, messageId) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const plainText = text
      .replace(/[*#`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/---/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle PDF Upload
  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a valid PDF document (.pdf)');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    setPdfUploading(true);
    const toastId = toast.loading(`Parsing "${file.name}"...`);

    try {
      const res = await chatbotApi.uploadPdf(formData);
      if (res.data?.success) {
        const { fileName, numPages, extractedText, totalCharacters } = res.data;
        setActivePdf({
          name: fileName,
          numPages,
          fullText: extractedText,
          totalCharacters,
        });

        toast.success(`Loaded "${fileName}" (${numPages} pages)`, { id: toastId });

        // Add an introductory message or quick prompt suggestion
        setInputMessage(`Can you provide an executive summary of ${fileName} and highlight its main points?`);
      }
    } catch (err) {
      console.error('PDF upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to parse PDF document', { id: toastId });
    } finally {
      setPdfUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  // Send Message
  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || loading) return;

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentSid = sessionId;
    trackSessionId(currentSid);

    const userMessageObj = {
      _id: `temp_${Date.now()}`,
      role: 'user',
      content: textToSend,
      pdfName: activePdf?.name || null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setInputMessage('');
    setLoading(true);

    try {
      const payload = {
        message: textToSend,
        sessionId: currentSid,
        pdfText: activePdf?.fullText || '',
        pdfName: activePdf?.name || '',
        pdfPages: activePdf?.numPages || 0,
        hasAudio: isListening,
      };

      const res = await chatbotApi.sendMessage(payload);

      if (res.data?.success) {
        const botMsgObj = {
          _id: res.data.messageId || `bot_${Date.now()}`,
          role: 'assistant',
          content: res.data.message,
          pdfName: activePdf?.name || null,
          timestamp: res.data.timestamp || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsgObj]);

        // Auto-speak reply if Voice Output is enabled
        if (voiceEnabled) {
          speakText(res.data.message, botMsgObj._id);
        }

        // Refresh sessions list in background to display new title
        loadSessions();
      }
    } catch (err) {
      console.error('Chat error:', err);
      toast.error(err.response?.data?.message || 'Error connecting to Nova AI. Please retry.');
      setMessages((prev) => [
        ...prev,
        {
          _id: `err_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ **Connection Error**: I could not reach the server or AI model. Please verify your internet connection or try again in a moment.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Start a brand new chat
  const handleStartNewChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingMessageId(null);
    const newSid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setSessionId(newSid);
    localStorage.setItem('nova_active_session_id', newSid);
    setMessages([]);
    setActivePdf(null);
    setInputMessage('');
    setSidebarOpen(false);
    toast.success('Started a new conversation');
  };

  // Switch to an existing session
  const handleSelectSession = (sid) => {
    window.speechSynthesis?.cancel();
    setSpeakingMessageId(null);
    setSessionId(sid);
    localStorage.setItem('nova_active_session_id', sid);
    loadSessionMessages(sid);
    setSidebarOpen(false);
  };

  // Delete a session
  const handleDeleteSession = async (e, sid) => {
    e.stopPropagation();
    try {
      await chatbotApi.deleteSession(sid);
      toast.success('Session removed');
      setSessions((prev) => prev.filter((s) => s.sessionId !== sid));

      // Remove from guest local storage
      const existing = JSON.parse(localStorage.getItem('nova_guest_sessions') || '[]');
      localStorage.setItem('nova_guest_sessions', JSON.stringify(existing.filter((id) => id !== sid)));

      if (sessionId === sid) {
        handleStartNewChat();
      }
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  // Copy message text
  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export current conversation to Markdown
  const handleExportChat = () => {
    if (!messages.length) {
      toast('No messages to export yet.');
      return;
    }
    const title = sessions.find((s) => s.sessionId === sessionId)?.title || 'Nova_AI_Conversation';
    let doc = `# ${title}\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    messages.forEach((m) => {
      doc += `### ${m.role === 'user' ? '👤 You' : '🤖 Nova AI'}\n${m.content}\n\n`;
    });

    const blob = new Blob([doc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported!');
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-inter"
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* SESSIONS HISTORY SIDEBAR */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col transition-transform duration-300 backdrop-blur-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Portal</span>
          </button>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Groq Ultra-Speed
          </span>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Sessions History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-hide">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Previous Chats (MongoDB)
            </span>
            <span className="text-slate-500">{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-500 text-xs">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
              No saved conversations yet. Start chatting to save automatically to MongoDB!
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.sessionId === sessionId;
              return (
                <div
                  key={s.sessionId}
                  onClick={() => handleSelectSession(s.sessionId)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-900/60 to-cyan-950/40 border border-cyan-500/40 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <span className="text-base flex-shrink-0">
                      {s.activePdf?.name ? '📄' : '💬'}
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium truncate">
                        {s.title || 'Untitled Conversation'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(s.lastMessageAt || s.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, s.sessionId)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-slate-200 truncate max-w-[120px]">
                {user?.name || 'Guest Explorer'}
              </p>
              <p className="text-[10px] text-slate-500">
                {user ? 'Cloud Synced' : 'Local + MongoDB'}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleExportChat}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
              title="Export Conversation to Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Top Floating App Bar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition lg:hidden"
              title="Open History"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Robo Avatar & Identity */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-cyan-300 animate-pulse" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Nova AI Assistant
                  <span className="hidden sm:inline text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    Voice + PDF Studio
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Powered by Groq High-Speed LLM & Real-Time Voice
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Voice Output Speaker Toggle */}
            <button
              onClick={() => {
                const nextVal = !voiceEnabled;
                setVoiceEnabled(nextVal);
                if (!nextVal) {
                  window.speechSynthesis?.cancel();
                  setSpeakingMessageId(null);
                }
                toast(nextVal ? '🔊 Auto-speak replies enabled' : '🔇 Auto-speak muted');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                voiceEnabled
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={voiceEnabled ? 'Voice Output ON' : 'Voice Output Muted'}
            >
              {voiceEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="hidden sm:inline">Voice ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice OFF</span>
                </>
              )}
            </button>

            {/* Quick Link to Browse Groups */}
            <button
              onClick={() => navigate('/explore')}
              className="hidden md:flex items-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study Groups</span>
            </button>
          </div>
        </header>

        {/* ACTIVE PDF NOTIFICATION BAR (If a PDF is loaded) */}
        {activePdf && (
          <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-between flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300">
                <FileText className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-semibold text-white truncate max-w-xs block">
                  📄 Analyzing: {activePdf.name}
                </span>
                <span className="text-[10px] text-indigo-300">
                  {activePdf.numPages} Pages • {(activePdf.totalCharacters || 0).toLocaleString()} characters extracted
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSendMessage(`Summarize the attached document "${activePdf.name}" into key points.`)}
                className="hidden sm:inline-flex text-[11px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg hover:bg-cyan-900/60 transition cursor-pointer"
              >
                ✨ Quick Summary
              </button>
              <button
                onClick={() => {
                  setActivePdf(null);
                  toast('Document context detached from active prompt.');
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Detach Document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES SCROLL VIEW */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 ? (
            /* WELCOME HERO BANNER */
            <div className="max-w-2xl mx-auto py-10 text-center animate-fade-in">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-1 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                  <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center">
                    <Bot className="w-10 h-10 text-cyan-300" />
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                How can I assist your studies today?
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Speak directly using the voice assistant, ask any complex question, or upload any PDF document to analyze instantly.
              </p>

              {/* PDF Drag & Drop Showcase Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-8 p-6 rounded-2xl border-2 border-dashed border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-900/40 hover:border-cyan-400/60 hover:bg-indigo-950/40 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-white mt-3">
                  Upload PDF Document to Analyze
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Drag and drop files here, or click to browse (BRD, research papers, notes, textbooks)
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-400 font-medium">
                  <span>Supported: .pdf (up to 30MB)</span>
                </div>
              </div>

              {/* Suggested Starter Prompts */}
              <div className="mt-8">
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
                  💡 Popular Questions & Prompts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {[
                    {
                      title: 'Explain Complex Theory',
                      desc: 'Break down how Transformer neural networks work in simple terms',
                      icon: '🧠',
                    },
                    {
                      title: 'Study Plan Generator',
                      desc: 'Design a 7-day revision schedule for upcoming final exams',
                      icon: '📅',
                    },
                    {
                      title: 'Analyze Code or Architecture',
                      desc: 'How do JWT tokens and MongoDB authentication work together?',
                      icon: '💻',
                    },
                    {
                      title: 'Analyze Study1.pdf',
                      desc: 'What are the business and technical requirements of Study Group Finder?',
                      icon: '📄',
                    },
                  ].map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(starter.desc)}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/70 transition text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{starter.icon}</span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                          {starter.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {starter.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGE LIST */
            messages.map((m) => {
              const isUser = m.role === 'user';
              const isSpeaking = speakingMessageId === m._id;

              return (
                <div
                  key={m._id || m.timestamp}
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {/* Assistant Robot Avatar */}
                  {!isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Active PDF Chip if message was related to a PDF */}
                    {m.pdfName && (
                      <span className="text-[10px] text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.5 rounded-md mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {m.pdfName}
                      </span>
                    )}

                    {/* Speech / Text Bubble */}
                    <div
                      className={`relative p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-none'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl rounded-tl-none prose-invert'
                      }`}
                    >
                      {/* Markdown rendered text */}
                      <div className="prose prose-invert prose-sm max-w-none break-words space-y-2">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>

                      {/* Assistant Bubble Footer Tools */}
                      {!isUser && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            {/* Listen Voice Button */}
                            <button
                              onClick={() => speakText(m.content, m._id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                                isSpeaking
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                              title={isSpeaking ? 'Stop speaking' : 'Read aloud with Voice'}
                            >
                              {isSpeaking ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>

                            {/* Copy Text Button */}
                            <button
                              onClick={() => handleCopyText(m.content, m._id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === m._id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <span className="text-[10px] text-slate-500">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Profile Avatar */}
                  {isUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* LOADING / BOT TYPING STATE */}
          {loading && (
            <div className="flex gap-3 sm:gap-4 justify-start animate-fade-in">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Bot className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-300"></span>
                <span className="text-xs text-slate-400 ml-2 font-medium">Nova is analyzing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* LIVE VOICE VISUALIZER BANNER (When Mic is Active) */}
        {isListening && (
          <div className="mx-4 sm:mx-6 mb-2 p-3 rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-900 to-indigo-950/90 border border-red-500/40 backdrop-blur-lg flex items-center justify-between animate-fade-in shadow-xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="absolute -inset-1 rounded-full bg-red-500 opacity-40 animate-ping"></span>
              </div>

              {/* Sound Wave Bars */}
              <div className="flex items-center gap-1 px-2">
                <span className="w-1 h-3 bg-red-400 rounded-full animate-bounce"></span>
                <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                <span className="w-1 h-6 bg-red-300 rounded-full animate-bounce delay-100"></span>
                <span className="w-1 h-4 bg-cyan-300 rounded-full animate-bounce delay-200"></span>
              </div>

              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-red-300">
                  Listening to your voice...
                </p>
                <p className="text-xs text-slate-200 italic truncate max-w-sm">
                  {speechInterim || 'Speak now...'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleListening}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition"
            >
              Done
            </button>
          </div>
        )}

        {/* BOTTOM INPUT DOCK */}
        <div className="p-4 sm:p-6 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex-shrink-0">
          {/* Quick suggestions when PDF is active */}
          {activePdf && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide text-xs">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> PDF Shortcuts:
              </span>
              <button
                onClick={() => handleSendMessage(`Provide a comprehensive summary of ${activePdf.name}`)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700 transition flex-shrink-0 cursor-pointer"
              >
                Summarize PDF
              </button>
              <button
                onClick={() => handleSendMessage(`What are the key technical and business requirements in ${activePdf.name}?`)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700 transition flex-shrink-0 cursor-pointer"
              >
                Key Requirements
              </button>
              <button
                onClick={() => handleSendMessage(`Create 5 multiple choice quiz questions based on ${activePdf.name} with answers`)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700 transition flex-shrink-0 cursor-pointer"
              >
                Generate Quiz
              </button>
            </div>
          )}

          {/* Hidden File Input for PDF */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handlePdfUpload(e.target.files[0]);
              }
            }}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center gap-2 rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-cyan-500/80 shadow-2xl p-2 transition-all"
          >
            {/* Attach PDF Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pdfUploading}
              className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${
                activePdf
                  ? 'bg-indigo-950 text-cyan-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Attach & Analyze PDF"
            >
              {pdfUploading ? (
                <span className="w-5 h-5 block border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                activePdf
                  ? `Ask anything about ${activePdf.name}...`
                  : 'Ask Nova anything or speak with voice...'
              }
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none px-2"
              disabled={loading}
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak with Voice Assistant'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${
                inputMessage.trim() && !loading
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30 hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-2">
            Nova AI integrates Groq ultra-fast inference, Web Speech voice synthesis, and full MongoDB history sync.
          </p>
        </div>
      </main>
    </div>
  );
}
