import { Bot, ExternalLink } from 'lucide-react';

const CHATBOT_URL = 'http://localhost:3000';

export default function ChatbotLauncher() {
  const openChatbot = () => {
    window.open(CHATBOT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      className="chatbot-launcher"
      onClick={openChatbot}
      aria-label="Open Nexus AI chatbot in a new tab"
      title="Open Nexus AI chatbot"
    >
      <span className="chatbot-launcher__halo" aria-hidden="true" />
      <span className="chatbot-launcher__antenna" aria-hidden="true" />
      <span className="chatbot-launcher__icon" aria-hidden="true">
        <Bot size={30} strokeWidth={1.8} />
      </span>
      <span className="chatbot-launcher__status" aria-hidden="true" />
      <span className="chatbot-launcher__label">Ask Nexus AI</span>
      <ExternalLink className="chatbot-launcher__external" size={14} aria-hidden="true" />
    </button>
  );
}