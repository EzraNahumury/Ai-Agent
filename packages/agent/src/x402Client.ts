import { createPaymentClient, parsePaymentResponseHeader, privateKeyToAccount } from 'x402-stacks';

export type X402Log = {
  message: string;
  timestamp: string;
};

export type X402Result = {
  response: Response;
  payment?: { txid?: string };
  logs: X402Log[];
};

type X402Options = {
  logger?: (log: X402Log) => void;
  privateKey?: string;
  network?: 'mainnet' | 'testnet';
};

const now = () => new Date().toISOString();

const logWith = (logs: X402Log[], logger: X402Options['logger'], message: string) => {
  const entry = { message, timestamp: now() };
  logs.push(entry);
  if (logger) logger(entry);
};

export async function x402Fetch(
  url: string,
  init: RequestInit = {},
  options: X402Options = {}
): Promise<X402Result> {
  const logs: X402Log[] = [];
  let paymentTxid: string | undefined;

  const privateKey = options.privateKey ?? process.env.STACKS_PRIVATE_KEY;
  if (!privateKey) {
    logWith(logs, options.logger, 'Error: Missing STACKS_PRIVATE_KEY');
    throw new Error('Missing STACKS_PRIVATE_KEY');
  }

  const network =
    options.network ??
    ((process.env.STACKS_NETWORK ?? 'testnet').toLowerCase() === 'mainnet' ? 'mainnet' : 'testnet');

  logWith(logs, options.logger, `Initializing x402 client (network: ${network})`);

  const account = privateKeyToAccount(privateKey, network);
  const target = new URL(url);

  logWith(
    logs,
    options.logger,
    `Agent address: ${account.address.slice(0, 8)}...${account.address.slice(-6)}`
  );

  const client = createPaymentClient(account, {
    baseURL: target.origin,
    timeout: 120000
  });

  const isPremium = url.includes('/premium/');
  if (isPremium) {
    logWith(logs, options.logger, 'Step 1: Sending request to premium API...');
  }

  const headers =
    init.headers instanceof Headers
      ? (init.headers as any)
      : (init.headers as Record<string, string> | undefined);

  let axiosResponse;
  try {
    axiosResponse = await client.request({
      url: `${target.pathname}${target.search}`,
      method: init.method ?? 'GET',
      headers,
      data: init.body
    });
  } catch (error: any) {
    axiosResponse = error?.response;
    if (!axiosResponse) {
      logWith(logs, options.logger, `Network error: ${error.message}`);
      throw error;
    }
  }

  if (isPremium) {
    if (axiosResponse.status === 402) {
      logWith(logs, options.logger, 'Step 2: Received HTTP 402 Payment Required');
      logWith(logs, options.logger, 'Step 3: Processing payment via x402-stacks...');
    } else if (axiosResponse.status === 200) {
      logWith(logs, options.logger, `Step 5: Success! Received premium data (HTTP ${axiosResponse.status})`);
    } else {
      logWith(logs, options.logger, `Response: HTTP ${axiosResponse.status} ${axiosResponse.statusText}`);
    }
  }

  const paymentHeader = axiosResponse.headers?.['payment-response'];
  if (paymentHeader) {
    const parsed = parsePaymentResponseHeader(paymentHeader);
    if (parsed?.transaction && !paymentTxid) {
      paymentTxid = parsed.transaction;
      logWith(logs, options.logger, 'Payment confirmed on-chain');
      logWith(logs, options.logger, `Transaction ID: ${paymentTxid}`);
    }
  }

  const rawBody = axiosResponse.data;
  const isBinary = rawBody instanceof ArrayBuffer || ArrayBuffer.isView(rawBody);
  const body =
    rawBody == null
      ? ''
      : typeof rawBody === 'string' || isBinary
        ? rawBody
        : JSON.stringify(rawBody);

  const responseHeaders = new Headers(axiosResponse.headers as Record<string, string>);
  if (!responseHeaders.has('content-type') && rawBody && typeof rawBody === 'object' && !isBinary) {
    responseHeaders.set('content-type', 'application/json');
  }

  const response = new Response(body as BodyInit, {
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    headers: responseHeaders
  });

  return {
    response,
    payment: paymentTxid ? { txid: paymentTxid } : undefined,
    logs
  };
}
