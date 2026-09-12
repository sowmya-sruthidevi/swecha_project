import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, Sparkles, MessageSquare, Mic, FileText, X } from 'lucide-react';

export default function FloatingRobo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Do not display if already on the full chatbot workspace
  const isChatbotPage = location.pathname === '/chatbot';

  useEffect(() => {
    if (isChatbotPage) return;

    // Show tooltip after a short delay to grab attention
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setShowTooltip(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isChatbotPage, hasInteracted]);

  if (isChatbotPage) return null;

  const handleClick = () => {
    navigate('/chatbot');
  };

  return (
    <aside
      aria-label="AI Assistant Floating Widget"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Speech Bubble Tooltip */}
      {showTooltip && (
        <div className="relative mb-3 max-w-xs animate-bounce-gentle rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-4 text-white shadow-2xl border border-indigo-500/40 backdrop-blur-xl">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              setHasInteracted(true);
            }}
            className="absolute top-2 right-2 rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-3 pr-4">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping"></span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                Nova AI Tutor <Sparkles className="w-3 h-3 text-amber-300" />
              </p>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Need help with your studies or have a PDF to analyze? Click me to chat with real-time voice & AI!
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Mic className="w-3 h-3 text-cyan-400" /> Voice + <FileText className="w-3 h-3 text-indigo-400" /> PDF
            </span>
            <button
              onClick={handleClick}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 font-medium text-white hover:brightness-110 transition shadow-sm cursor-pointer"
            >
              Open Studio →
            </button>
          </div>

          {/* Chat bubble beak */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-slate-900 border-r border-b border-indigo-500/40 transform rotate-45"></div>
        </div>
      )}

      {/* Floating Robo Avatar Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        className="group relative flex items-center justify-center focus:outline-none cursor-pointer"
        title="Open AI Chatbot & Voice Assistant"
        aria-label="Open AI Chatbot & Voice Assistant"
      >
        {/* Holographic Glowing Pulse Rings */}
        <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 opacity-60 blur-lg group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></span>
        <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-30 animate-ping duration-1000"></span>

        {/* 3D Robot Orb Container */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-1 border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.6)] transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
          {/* Inner Robot Glass Face */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-indigo-900/90 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Robot Antenna */}
            <div className="absolute top-1.5 flex flex-col items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping"></div>
              <div className="w-0.5 h-1.5 bg-cyan-400/80"></div>
            </div>

            {/* Glowing Robo Eyes */}
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-2.5 h-3.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-pulse"></div>
              <div className="w-2.5 h-3.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-pulse"></div>
            </div>

            {/* Robot Smile / Visualizer line */}
            <div className="w-5 h-1 rounded-full bg-indigo-400/70 mt-1.5 group-hover:bg-cyan-300 transition-colors"></div>

            {/* Subtle Sound Wave Overlay on Hover */}
            <div className="absolute bottom-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
              <span className="w-0.5 h-3.5 bg-cyan-300 rounded-full animate-bounce delay-75"></span>
              <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>

          {/* Badge: Online Status */}
          <span className="absolute bottom-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
          </span>
        </div>

        {/* Floating Label pill */}
        <span className="absolute right-20 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-900/95 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30 shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none hidden sm:block">
          ⚡ Nova AI Chatbot
        </span>
      </button>
    </aside>
  );
}
