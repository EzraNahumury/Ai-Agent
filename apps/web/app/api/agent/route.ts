import { NextResponse } from 'next/server';
import { runAgent } from '@x402/agent';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  const baseUrl = process.env.SERVER_BASE_URL ?? 'http://localhost:4000';

  // Debug: Log environment variables
  console.log('[API] Environment check:', {
    baseUrl,
    hasPrivateKey: !!process.env.STACKS_PRIVATE_KEY,
    network: process.env.STACKS_NETWORK
  });

  if (!query && !prompt) {
    return NextResponse.json(
      { ok: false, status: 400, error: 'Missing query' },
      { status: 400 }
    );
  }

  try {
    console.log('[API] Starting agent with query:', query);

    const timeoutMs = Number(process.env.AGENT_TIMEOUT_MS ?? 120000);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Agent timeout after ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs);
    });

    const agentPromise = runAgent({ baseUrl, query, prompt });

    const result = await Promise.race([agentPromise, timeoutPromise]);

    console.log('[API] Agent completed successfully');
    return NextResponse.json(result);
  } catch (err) {
    console.error('[API] Agent error:', err);
    return NextResponse.json(
      { ok: false, status: 500, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
