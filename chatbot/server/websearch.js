/**
 * Web Search Service for Hybrid RAG
 * Provides live web search results (job trends, market openings, industry demand, salaries, news)
 * Supports zero-config keyless DuckDuckGo search + optional Tavily API if configured.
 */

/**
 * Strips HTML tags and unescapes common entities
 */
function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches DuckDuckGo Lite via POST (reliable, fast, no bot-check blocks, no API key needed)
 */
async function searchDuckDuckGoLite(query, maxResults = 5) {
  try {
    const form = new URLSearchParams();
    form.append('q', query);

    const response = await fetch('https://lite.duckduckgo.com/lite/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      body: form.toString(),
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo Lite returned HTTP ${response.status}`);
    }

    const text = await response.text();
    const rows = text.split(/<tr/i);
    const results = [];

    let currentResult = null;
    for (const row of rows) {
      // Skip sponsored/ad rows
      if (row.includes('result-sponsored')) continue;

      // Extract title & URL
      const linkMatch = row.match(/<a[^>]*class=['"]result-link['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>|<a[^>]*href=['"]([^'"]+)['"][^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/i);
      if (linkMatch) {
        let rawUrl = linkMatch[1] || linkMatch[3];
        if (rawUrl && rawUrl.includes('uddg=')) {
          const match = rawUrl.match(/uddg=([^&]+)/);
          if (match) rawUrl = decodeURIComponent(match[1]);
        }
        const title = stripHTML(linkMatch[2] || linkMatch[4] || '');
        if (title && title.toLowerCase() !== 'more info' && rawUrl) {
          currentResult = {
            title,
            url: rawUrl,
            snippet: '',
            source: 'Live Web Search'
          };
          results.push(currentResult);
          if (results.length >= maxResults) break;
        }
      } else if (currentResult && row.includes('result-snippet')) {
        const snipMatch = row.match(/<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/i);
        if (snipMatch) {
          currentResult.snippet = stripHTML(snipMatch[1]);
          currentResult = null;
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('DuckDuckGo Lite search notice:', err.message);
    return [];
  }
}

/**
 * Fallback to DuckDuckGo Instant Answer API
 */
async function searchDuckDuckGoInstant(query, maxResults = 5) {
  try {
    const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(instantUrl, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    const results = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || 'https://duckduckgo.com',
        snippet: data.AbstractText,
        source: 'DuckDuckGo Knowledge Base'
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.forEach(topic => {
        if (results.length < maxResults && topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || query,
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo Web'
          });
        }
      });
    }

    return results;
  } catch (err) {
    console.warn('Instant answer search notice:', err.message);
    return [];
  }
}

/**
 * Optional Tavily API if user provides TAVILY_API_KEY in .env
 */
async function searchTavily(query, maxResults = 5) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults
      }),
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results || []).map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      source: 'Tavily Search'
    }));
  } catch (e) {
    return null;
  }
}

/**
 * Unified live web search entry point
 * Returns structured search results + formatted context string
 */
async function performLiveWebSearch(query, maxResults = 4) {
  console.log(`🌐 Performing live web search for: "${query}"`);
  
  // 1. Try Tavily if API key is provided
  let results = await searchTavily(query, maxResults);

  // 2. Try DuckDuckGo Lite (zero keys, high speed, reliable)
  if (!results || results.length === 0) {
    results = await searchDuckDuckGoLite(query, maxResults);
  }

  // 3. Try DuckDuckGo Instant as second fallback
  if (!results || results.length === 0) {
    results = await searchDuckDuckGoInstant(query, maxResults);
  }

  // 4. Format context string and return
  if (results && results.length > 0) {
    const contextString = results.map((r, idx) => 
      `[WEB SOURCE #${idx + 1}: ${r.title}]\nURL: ${r.url}\nSummary: ${r.snippet || r.title}`
    ).join('\n\n');

    return {
      success: true,
      query,
      results,
      contextString
    };
  }

  return {
    success: false,
    query,
    results: [],
    contextString: ''
  };
}

module.exports = {
  performLiveWebSearch,
  searchDuckDuckGoLite
};
