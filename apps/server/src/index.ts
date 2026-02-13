import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { premiumRouter } from './premiumRoutes.js';
import { facilitatorRouter } from './facilitatorRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/facilitator', facilitatorRouter);
app.use('/premium', premiumRouter);

const port = Number(process.env.PORT ?? process.env.SERVER_PORT ?? 4000);
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
