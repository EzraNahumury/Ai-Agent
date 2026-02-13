import type { NextFunction, Request, Response } from 'express';
import { paymentMiddleware as x402PaymentMiddleware } from 'x402-stacks';

const parseBigInt = (value: string | undefined, fallback: bigint): bigint => {
  if (!value) return fallback;
  try {
    return BigInt(value);
  } catch {
    return fallback;
  }
};

export function paymentMiddleware(req: Request, res: Response, next: NextFunction) {
  const recipient = process.env.STACKS_RECIPIENT_ADDRESS;
  if (!recipient) {
    res.status(500).json({ error: 'Missing STACKS_RECIPIENT_ADDRESS' });
    return;
  }

  const priceUstx = parseBigInt(process.env.PRICE_USTX, 1000n);
  const network =
    (process.env.STACKS_NETWORK ?? 'testnet').toLowerCase() === 'mainnet' ? 'mainnet' : 'testnet';
  const facilitatorUrl = process.env.FACILITATOR_URL ?? 'http://localhost:4000/facilitator';
  const memo = process.env.PAYMENT_MEMO ?? 'x402 payment';

  return x402PaymentMiddleware({
    network,
    amount: priceUstx,
    payTo: recipient,
    facilitatorUrl,
    description: memo,
    mimeType: 'application/json'
  })(req, res, next);
}

