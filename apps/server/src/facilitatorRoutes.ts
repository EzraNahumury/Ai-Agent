import { Router } from 'express';
import { broadcastTransaction, deserializeTransaction } from '@stacks/transactions';

const router = Router();

const isHex = (value: string) => /^(0x)?[0-9a-fA-F]+$/.test(value);

const normalizeHex = (value: string) => (value.startsWith('0x') ? value.slice(2) : value);

const parseTransactionHex = (payload: any): string | null => {
  const candidate =
    payload?.paymentPayload?.payload?.transaction ??
    payload?.paymentPayload?.transaction ??
    payload?.payload?.transaction ??
    payload?.transaction ??
    null;

  if (typeof candidate === 'string' && isHex(candidate)) {
    return normalizeHex(candidate);
  }

  return null;
};

const resolveNetwork = (payload: any) => {
  const networkValue =
    payload?.paymentRequirements?.network ??
    payload?.paymentPayload?.accepted?.network ??
    payload?.accepted?.network ??
    payload?.network ??
    '';

  const value = typeof networkValue === 'string' ? networkValue.toLowerCase() : '';
  if (value.includes('mainnet') || value === 'stacks:1') {
    return 'mainnet';
  }
  return 'testnet';
};

router.get('/supported', (_req, res) => {
  res.json({
    success: true,
    supported: [
      {
        scheme: 'exact',
        network: 'stacks:2147483648',
        asset: 'STX'
      }
    ]
  });
});

router.post('/verify', (_req, res) => {
  res.json({
    success: true,
    status: 'confirmed'
  });
});

router.post('/settle', async (req, res) => {
  const payload = req.body ?? {};
  const txHex = parseTransactionHex(payload);
  const network = resolveNetwork(payload);

  let txId: string | null = null;
  if (txHex) {
    try {
      const tx = deserializeTransaction(txHex);
      const networkName = network === 'mainnet' ? 'mainnet' : 'testnet';

      console.log('[facilitator] Broadcasting to Stacks', networkName);

      const broadcastResult = await broadcastTransaction({
        transaction: tx,
        network: networkName as any
      });

      console.log('[facilitator] Broadcast result:', JSON.stringify(broadcastResult));

      if ('txid' in broadcastResult) {
        txId = broadcastResult.txid;
        console.log('[facilitator] TX confirmed:', txId);
      } else {
        console.warn('[facilitator] Broadcast rejected:', broadcastResult);
      }
    } catch (error) {
      console.error('[facilitator] Broadcast error:', error instanceof Error ? error.message : error);
    }
  }

  res.json({
    success: true,
    payer: payload?.payer ?? null,
    transaction: txHex ? `0x${txHex}` : null,
    txid: txId,
    network: network === 'mainnet' ? 'stacks:1' : 'stacks:2147483648'
  });
});

export { router as facilitatorRouter };
