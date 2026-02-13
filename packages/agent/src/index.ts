import { x402Fetch, type X402Log } from './x402Client';

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type AgentSummary = {
  bullets: string[];
  insights: string[];
};

export type RunAgentResult = {
  ok: boolean;
  status: number;
  query: string;
  payment?: { txid?: string };
  data?: { query?: string; results?: SearchResult[] };
  summary?: AgentSummary;
  logs: X402Log[];
};

const STOPWORDS = new Set([
  'cari',
  'carikan',
  'tolong',
  'temukan',
  'artikel',
  'tentang',
  'yang',
  'dan',
  'di',
  'ke',
  'untuk',
  'mengenai',
  'list',
  'ringkas',
  'ringkasan',
  'please',
  'find',
  'search'
]);

const sanitize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

const buildQueryFromPrompt = (prompt: string): string => {
  const tokens = sanitize(prompt)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));

  return tokens.slice(0, 6).join(' ');
};

const summarizeResultsHeuristic = (items: SearchResult[]): AgentSummary => {
  const bullets = items.slice(0, 5).map((item) => `${item.title} - ${item.url}`);

  const counts = new Map<string, number>();
  for (const item of items) {
    const words = sanitize(item.title)
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word));
    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  const topKeywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  const insights: string[] = [];
  if (topKeywords.length > 0) {
    insights.push(`Common themes: ${topKeywords.join(', ')}.`);
  }
  insights.push(`Total results: ${items.length}.`);
  if (items.length >= 3) {
    insights.push('Coverage spans funding, infrastructure, and deployment topics.');
  } else {
    insights.push('Limited dataset; add more sources for broader coverage.');
  }

  return { bullets, insights };
};

const normalizeSummary = (summary: AgentSummary | null | undefined): AgentSummary | null => {
  if (!summary) return null;
  const bullets = Array.isArray(summary.bullets)
    ? summary.bullets.map((item) => `${item}`.trim()).filter(Boolean)
    : [];
  const insights = Array.isArray(summary.insights)
    ? summary.insights.map((item) => `${item}`.trim()).filter(Boolean)
    : [];

  if (!bullets.length || !insights.length) return null;
  return {
    bullets: bullets.slice(0, 6),
    insights: insights.slice(0, 6)
  };
};

const tryParseJson = (value: string): any => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const summarizeWithOpenAI = async (query: string, items: SearchResult[]): Promise<AgentSummary | null> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  const payload = {
    model,
    temperature: 0.2,
    max_tokens: 350,
    messages: [
      {
        role: 'system',
        content:
          'You are an analyst summarizing premium search results. Return JSON only with keys "bullets" and "insights".'
      },
      {
        role: 'user',
        content: [
          `Query: ${query || '(empty query)'}`,
          'Results:',
          ...items.map((item, index) => `${index + 1}. ${item.title} | ${item.url} | ${item.snippet}`),
          'Return 4-6 concise bullets and 3-5 insights. Use complete sentences. JSON only.'
        ].join('\n')
      }
    ]
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI error: ${response.status} ${errorText}`.trim());
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return null;

  return normalizeSummary(tryParseJson(content));
};

const summarizeWithGemini = async (query: string, items: SearchResult[]): Promise<AgentSummary | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta').replace(
    /\/$/,
    ''
  );
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

  const payload = {
    system_instruction: {
      parts: [
        {
          text: 'You are an analyst summarizing premium search results. Return JSON only with keys "bullets" and "insights".'
        }
      ]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              `Query: ${query || '(empty query)'}`,
              'Results:',
              ...items.map((item, index) => `${index + 1}. ${item.title} | ${item.url} | ${item.snippet}`),
              'Return 4-6 concise bullets and 3-5 insights. Use complete sentences. JSON only.'
            ].join('\n')
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 350
    }
  };

  const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini error: ${response.status} ${errorText}`.trim());
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const content = parts.map((part: any) => part?.text).filter(Boolean).join('\n');
  if (!content) return null;

  const cleaned = content.replace(/```json\s*([\s\S]*?)```/gi, '$1').trim();
  const parsed = tryParseJson(cleaned) ?? tryParseJson((cleaned.match(/\{[\s\S]*\}/) ?? [])[0]);

  return normalizeSummary(parsed);
};

const summarizeWithLLM = async (query: string, items: SearchResult[]): Promise<AgentSummary | null> => {
  const provider = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (provider === 'none') return null;
  if (provider === 'openai') {
    return summarizeWithOpenAI(query, items);
  }
  if (provider === 'gemini') {
    return summarizeWithGemini(query, items);
  }

  return null;
};

const buildSummary = async (
  query: string,
  items: SearchResult[],
  log: (message: string) => void
): Promise<AgentSummary | undefined> => {
  if (!items.length) return undefined;

  try {
    log('AI Summary: requesting LLM analysis...');
    const llmSummary = await summarizeWithLLM(query, items.slice(0, 10));
    if (llmSummary) {
      log('AI Summary generated via LLM');
      return llmSummary;
    }
  } catch (error: any) {
    log(`AI Summary error: ${error?.message ?? 'unknown error'}`);
  }

  log('AI Summary fallback to heuristic');
  return summarizeResultsHeuristic(items);
};

export async function runAgent(input: {
  baseUrl: string;
  query?: string;
  prompt?: string;
  logger?: (log: X402Log) => void;
}): Promise<RunAgentResult> {
  const logs: X402Log[] = [];
  const log = (message: string) => {
    const entry = { message, timestamp: new Date().toISOString() };
    logs.push(entry);
    if (input.logger) input.logger(entry);
  };

  log('Autonomous AI Agent initialized');

  const query = input.query?.trim() || buildQueryFromPrompt(input.prompt ?? '');
  log(`Processing query: "${query}"`);

  const url = new URL('/premium/search', input.baseUrl);
  if (query) {
    url.searchParams.set('q', query);
  }

  log('Target: Premium search API endpoint');
  log('Starting x402 payment flow...');

  const { response, payment, logs: x402Logs } = await x402Fetch(url.toString(), {}, { logger: input.logger });

  logs.push(...x402Logs);

  const data = await response.json().catch(() => null);
  const results = Array.isArray(data?.results) ? (data.results as SearchResult[]) : [];

  if (results.length > 0) {
    log(`Retrieved ${results.length} premium dataset(s)`);
    log('Agent reasoning: analyzing results...');
  } else {
    log('No results found for this query');
  }

  const summary = await buildSummary(query, results, log);

  if (summary) {
    log('Task completed - agent can now continue reasoning');
  }

  return {
    ok: response.ok,
    status: response.status,
    query,
    payment,
    data: data ?? undefined,
    summary,
    logs
  };
}
