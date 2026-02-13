import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { getPayment } from 'x402-stacks';
import { paymentMiddleware } from './paymentMiddleware.js';

const router = Router();

type PremiumItem = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  createdAt: string;
  creator: string;
};

type LocalApiEntry = {
  apiName?: string;
  status?: boolean;
  documentationUrl?: string | null;
  developer?: { name?: string | null; profileUrl?: string | null } | null;
  description?: string;
  authentication?: string | boolean | null;
};

type LocalApiCategory = {
  categoryName?: string;
  apis?: LocalApiEntry[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = path.resolve(__dirname, '../../../DAFTAR-API-LOKAL-INDONESIA-master/data');

const safeReadJson = (filePath: string): LocalApiCategory | null => {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const pickLocaleFile = (dir: string, locale: string): string | null => {
  const candidates = [locale, 'id', 'en'];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const filePath = path.join(dir, `${candidate}.json`);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
};

const formatAuth = (auth: LocalApiEntry['authentication']): string => {
  if (auth === true) return 'required';
  if (auth === false || auth == null) return 'none';
  return String(auth);
};

const formatStatus = (status: LocalApiEntry['status']): string => (status === false ? 'inactive' : 'active');

const loadLocalApiDataset = (): PremiumItem[] => {
  if (!fs.existsSync(DATA_ROOT)) {
    console.warn('[premium] Local API dataset not found:', DATA_ROOT);
    return [];
  }

  const locale = (process.env.LOCAL_API_LOCALE ?? 'id').toLowerCase();
  const entries: PremiumItem[] = [];
  const categoryDirs = fs
    .readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  let counter = 0;
  for (const categoryDir of categoryDirs) {
    const dirPath = path.join(DATA_ROOT, categoryDir);
    const jsonPath = pickLocaleFile(dirPath, locale);
    if (!jsonPath) continue;

    const data = safeReadJson(jsonPath);
    const categoryName = data?.categoryName ?? categoryDir;
    const apis = Array.isArray(data?.apis) ? data.apis : [];

    for (const api of apis) {
      const title = api.apiName ?? 'Unknown API';
      const url = api.documentationUrl ?? '';
      const description = api.description ?? 'Deskripsi tidak tersedia.';
      const developerName = api.developer?.name ? `Developer: ${api.developer.name}.` : '';
      const auth = `Auth: ${formatAuth(api.authentication)}.`;
      const status = `Status: ${formatStatus(api.status)}.`;
      const category = `Kategori: ${categoryName}.`;

      const snippet = [description, category, auth, status, developerName].filter(Boolean).join(' ');

      entries.push({
        id: `local-${categoryDir}-${counter++}`,
        title,
        url,
        snippet,
        createdAt: new Date().toISOString(),
        creator: 'local-api-list'
      });
    }
  }

  return entries;
};

const dataset: PremiumItem[] = loadLocalApiDataset();

const normalize = (value: string) => value.toLowerCase();

const matchesQuery = (item: PremiumItem, query: string) => {
  if (!query) return true;
  const term = normalize(query);
  const haystack = normalize(`${item.title} ${item.snippet} ${item.url}`);
  return haystack.includes(term);
};

router.get('/search', paymentMiddleware, (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const payment = getPayment(req);
  const results = dataset.filter((item) => matchesQuery(item, q));

  res.json({
    query: q,
    results,
    paid: Boolean(payment),
    payment: payment ?? null
  });
});

router.post('/datasets', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  const snippet = typeof req.body?.snippet === 'string' ? req.body.snippet.trim() : '';
  const creator = typeof req.body?.creator === 'string' ? req.body.creator.trim() : '';

  if (!title || !url || !snippet || !creator) {
    res.status(400).json({ ok: false, error: 'Missing title, url, snippet, or creator' });
    return;
  }

  const item: PremiumItem = {
    id: `user-${Date.now()}`,
    title,
    url,
    snippet,
    createdAt: new Date().toISOString(),
    creator
  };

  dataset.unshift(item);

  res.json({ ok: true, item });
});

export { router as premiumRouter };
