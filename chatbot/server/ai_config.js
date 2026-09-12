function normalizeKey(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getAIConfig() {
  const groqKey = normalizeKey(process.env.GROQ_API_KEY);
  const openaiKey = normalizeKey(process.env.OPENAI_API_KEY);

  const hasGroqKey = Boolean(groqKey && groqKey.startsWith('gsk_'));
  const hasOpenAIKey = Boolean(openaiKey && (openaiKey.startsWith('sk-') || openaiKey.startsWith('sk-proj-')));

  if (hasGroqKey) {
    return {
      provider: 'groq',
      apiKey: groqKey,
      isGroq: true,
      isOpenAI: false,
      hasKey: true,
      ready: true
    };
  }

  if (hasOpenAIKey) {
    return {
      provider: 'openai',
      apiKey: openaiKey,
      isGroq: false,
      isOpenAI: true,
      hasKey: true,
      ready: true
    };
  }

  return {
    provider: 'none',
    apiKey: '',
    isGroq: false,
    isOpenAI: false,
    hasKey: false,
    ready: false
  };
}

function getAIStatus() {
  const config = getAIConfig();
  if (!config.ready) {
    return {
      provider: 'not-configured',
      configured: false,
      ready: false,
      message: 'No valid Groq or OpenAI API key is configured in .env.'
    };
  }

  return {
    provider: config.provider,
    configured: true,
    ready: true,
    message: `${config.provider.toUpperCase()} API is configured and ready.`
  };
}

module.exports = {
  getAIConfig,
  getAIStatus
};
