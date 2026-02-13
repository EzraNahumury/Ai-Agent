'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppConfig, UserSession } from '@stacks/auth';
import { showConnect } from '@stacks/connect';
import EarthGlobe from './EarthGlobe';

type AgentLog = {
  message: string;
  timestamp: string;
};

type AgentResponse = {
  ok: boolean;
  status: number;
  payment?: { txid?: string };
  data?: { results?: { title: string; url: string; snippet: string }[] };
  summary?: { bullets: string[]; insights: string[] };
  logs?: AgentLog[];
  error?: string;
};

type DatasetDraft = {
  title: string;
  url: string;
  snippet: string;
};

type Lang = 'id' | 'en';

const translations = {
  id: {
    heroEyebrow: 'HTTP 402 + x402-stacks',
    heroTitle: 'Autonomous AI Agent yang Membayar Sendiri',
    heroSub: 'AI Agent otonom yang dapat mengakses resource premium, melakukan pembayaran otomatis via x402-stacks blockchain Stacks, dan melanjutkan reasoning tanpa campur tangan manusia.',

    flowTitle: 'Cara Kerja Sistem',
    flowStep1Title: 'Request ke API Premium',
    flowStep1Desc: 'Agent mengirim request ke resource yang dilindungi',
    flowStep2Title: 'Server Respons 402',
    flowStep2Desc: 'Server mengembalikan HTTP 402 Payment Required dengan info pembayaran',
    flowStep3Title: 'Pembayaran Otomatis',
    flowStep3Desc: 'Agent membayar via x402-stacks dan mendapat bukti pembayaran',
    flowStep4Title: 'Retry dengan Bukti',
    flowStep4Desc: 'Agent mengulang request dengan bukti pembayaran',
    flowStep5Title: 'Data Premium Diterima',
    flowStep5Desc: 'Server verifikasi pembayaran dan kirim data premium',

    walletEyebrow: 'Leather Wallet (Opsional)',
    walletTitle: 'Koneksi Wallet untuk Publisher',
    walletHint: 'Wallet diperlukan hanya untuk membuat dataset premium baru. Agent menggunakan private key sendiri untuk pembayaran otomatis.',
    walletDisconnect: 'Disconnect',
    walletConnect: 'Connect Leather',
    walletConnected: 'Terhubung',
    walletNotConnected: 'Belum terhubung',
    walletCancelled: 'Koneksi wallet dibatalkan.',

    datasetEyebrow: 'Publisher',
    datasetTitle: 'Buat Dataset Premium',
    datasetHint: 'Data baru akan disimpan in-memory untuk demo ini. Koneksi wallet diperlukan untuk publish.',
    datasetLabelTitle: 'Judul Dataset',
    datasetPlaceholderTitle: 'Contoh: Climate risk analytics vendors',
    datasetLabelUrl: 'URL Sumber',
    datasetLabelSnippet: 'Deskripsi Singkat',
    datasetPlaceholderSnippet: 'Deskripsi singkat tentang dataset premium ini.',
    datasetPublishing: 'Publishing...',
    datasetPublish: 'Publish Dataset',
    datasetErrWallet: 'Hubungkan Leather wallet untuk publish dataset.',
    datasetErrFields: 'Isi judul, URL, dan deskripsi.',
    datasetSuccess: 'Dataset dipublikasikan. Jalankan agent untuk refresh hasil.',
    datasetErrFailed: 'Gagal membuat dataset.',

    agentEyebrow: 'AI Agent',
    agentTitle: 'Jalankan Autonomous Agent',
    agentHint: 'Agent akan otomatis: request \u2192 terima 402 \u2192 bayar \u2192 retry \u2192 dapat data \u2192 reasoning',
    agentProcessing: 'Memproses...',
    agentLabelQuery: 'Query Pencarian',
    agentPlaceholder: 'Ketik pencarian Anda... (contoh: saham, cuaca, berita)',
    agentRunning: '\u23F3 Memproses...',
    agentRun: '\u25B6 Run Agent',

    logsTitle: 'Agent Logs',
    logsEmpty: 'Belum ada log. Jalankan agent untuk melihat proses.',

    summaryTitle: 'AI Summary',
    summaryBullets: 'Poin Utama',
    summaryInsights: 'Insights',
    summaryEmpty: 'Jalankan agent untuk melihat AI summary dari data premium.',

    resultsTitle: 'Premium Data',
    resultsEmpty: 'Data premium akan muncul di sini setelah agent berhasil melakukan pembayaran.',

    rawTitle: 'Raw JSON Response',
    rawWaiting: '{\n  "status": "waiting",\n  "message": "Jalankan agent untuk melihat response"\n}',

    footerX402Title: 'Apa itu x402-stacks?',
    footerX402Desc: 'x402-stacks adalah implementasi standar HTTP 402 (Payment Required) di blockchain Stacks. Memungkinkan pembayaran otomatis per-request tanpa akun atau subscription.',
    footerAgentTitle: 'Autonomous Agent',
    footerAgentDesc: 'Agent ini dapat membuat keputusan ekonomi sendiri - mendeteksi resource berbayar, melakukan pembayaran on-chain, dan melanjutkan task tanpa intervensi manusia.',
    footerM2mTitle: 'Machine-to-Machine Payment',
    footerM2mDesc: 'Tidak perlu API key, tidak perlu login. Program dapat langsung membayar dan mengakses resource, membuka era baru untuk AI agent yang benar-benar otonom.',
  },
  en: {
    heroEyebrow: 'HTTP 402 + x402-stacks',
    heroTitle: 'Self-Paying Autonomous AI Agent',
    heroSub: 'An autonomous AI agent that accesses premium resources, performs automatic payments via x402-stacks on the Stacks blockchain, and continues reasoning without human intervention.',

    flowTitle: 'How It Works',
    flowStep1Title: 'Request Premium API',
    flowStep1Desc: 'Agent sends a request to the protected resource',
    flowStep2Title: 'Server Responds 402',
    flowStep2Desc: 'Server returns HTTP 402 Payment Required with payment instructions',
    flowStep3Title: 'Automatic Payment',
    flowStep3Desc: 'Agent pays via x402-stacks and receives proof of payment',
    flowStep4Title: 'Retry with Proof',
    flowStep4Desc: 'Agent retries the request with payment proof',
    flowStep5Title: 'Premium Data Received',
    flowStep5Desc: 'Server verifies payment and delivers premium data',

    walletEyebrow: 'Leather Wallet (Optional)',
    walletTitle: 'Wallet Connection for Publishers',
    walletHint: 'Wallet is only needed to create new premium datasets. The agent uses its own private key for automatic payments.',
    walletDisconnect: 'Disconnect',
    walletConnect: 'Connect Leather',
    walletConnected: 'Connected',
    walletNotConnected: 'Not connected',
    walletCancelled: 'Wallet connection was cancelled.',

    datasetEyebrow: 'Publisher',
    datasetTitle: 'Create Premium Dataset',
    datasetHint: 'New data is stored in-memory for this demo. Wallet connection is required to publish.',
    datasetLabelTitle: 'Dataset Title',
    datasetPlaceholderTitle: 'Example: Climate risk analytics vendors',
    datasetLabelUrl: 'Source URL',
    datasetLabelSnippet: 'Short Description',
    datasetPlaceholderSnippet: 'A brief description of this premium dataset.',
    datasetPublishing: 'Publishing...',
    datasetPublish: 'Publish Dataset',
    datasetErrWallet: 'Connect your Leather wallet to publish a dataset.',
    datasetErrFields: 'Fill out title, URL, and description.',
    datasetSuccess: 'Dataset published. Run the agent to refresh results.',
    datasetErrFailed: 'Failed to create dataset.',

    agentEyebrow: 'AI Agent',
    agentTitle: 'Run Autonomous Agent',
    agentHint: 'Agent will automatically: request \u2192 receive 402 \u2192 pay \u2192 retry \u2192 get data \u2192 reasoning',
    agentProcessing: 'Processing...',
    agentLabelQuery: 'Search Query',
    agentPlaceholder: 'Type your search... (e.g. shopee, weather, crypto)',
    agentRunning: '\u23F3 Running...',
    agentRun: '\u25B6 Run Agent',

    logsTitle: 'Agent Logs',
    logsEmpty: 'No logs yet. Run the agent to see the process.',

    summaryTitle: 'AI Summary',
    summaryBullets: 'Key Points',
    summaryInsights: 'Insights',
    summaryEmpty: 'Run the agent to see an AI summary of the premium data.',

    resultsTitle: 'Premium Data',
    resultsEmpty: 'Premium data will appear here after the agent successfully makes a payment.',

    rawTitle: 'Raw JSON Response',
    rawWaiting: '{\n  "status": "waiting",\n  "message": "Run the agent to see the response"\n}',

    footerX402Title: 'What is x402-stacks?',
    footerX402Desc: 'x402-stacks is an implementation of the HTTP 402 (Payment Required) standard on the Stacks blockchain. It enables automatic per-request payments without accounts or subscriptions.',
    footerAgentTitle: 'Autonomous Agent',
    footerAgentDesc: 'This agent can make its own economic decisions \u2014 detecting paid resources, making on-chain payments, and continuing tasks without human intervention.',
    footerM2mTitle: 'Machine-to-Machine Payment',
    footerM2mDesc: 'No API keys, no logins needed. Programs can directly pay for and access resources, opening a new era for truly autonomous AI agents.',
  },
} as const;

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
const stacksNetwork =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK ?? 'testnet').toLowerCase() === 'mainnet'
    ? 'mainnet'
    : 'testnet';

const getStxAddress = (userData: any, network: 'mainnet' | 'testnet') => {
  const stxAddress = userData?.profile?.stxAddress;
  if (!stxAddress) return null;
  if (typeof stxAddress === 'string') return stxAddress;
  return stxAddress[network] ?? stxAddress.mainnet ?? stxAddress.testnet ?? null;
};

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export default function Page() {
  const [lang, setLang] = useState<Lang>('en');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetDraft>({ title: '', url: '', snippet: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    if (!userSession.isUserSignedIn()) return;
    const userData = userSession.loadUserData();
    const address = getStxAddress(userData, stacksNetwork);
    if (address) {
      setWalletAddress(address);
    }
  }, []);

  const runAgent = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        ok: false,
        status: 0,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = () => {
    if (typeof window === 'undefined') return;
    setWalletError(null);
    showConnect({
      userSession,
      appDetails: {
        name: 'x402 Stacks Agent',
        icon: `${window.location.origin}/favicon.ico`
      },
      redirectTo: '/',
      onFinish: () => {
        const userData = userSession.loadUserData();
        const address = getStxAddress(userData, stacksNetwork);
        setWalletAddress(address);
      },
      onCancel: () => {
        setWalletError(t.walletCancelled);
      }
    });
  };

  const disconnectWallet = () => {
    if (typeof window === 'undefined') return;
    userSession.signUserOut(window.location.origin);
    setWalletAddress(null);
  };

  const createDataset = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    if (!walletAddress) {
      setCreateError(t.datasetErrWallet);
      return;
    }
    if (!dataset.title || !dataset.url || !dataset.snippet) {
      setCreateError(t.datasetErrFields);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataset, creator: walletAddress })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setCreateError(data?.error ?? t.datasetErrFailed);
        return;
      }
      setCreateSuccess(t.datasetSuccess);
      setDataset({ title: '', url: '', snippet: '' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  const logs = result?.logs ?? [];
  const results = result?.data?.results ?? [];
  const summary = result?.summary;

  const groupedResults = useMemo(() => results.slice(0, 10), [results]);

  return (
    <main className="page">
      <section className="hero-section">
        <div className="hero-globe">
          <EarthGlobe />
        </div>
        <header className="hero">
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p className="sub">{t.heroSub}</p>
        </header>
      </section>

      {/* Flow Diagram */}
      <section className="flow-section">
        <h2 className="flow-title">{t.flowTitle}</h2>
        <div className="flow-diagram">
          <div className="flow-step">
            <div className="flow-number">1</div>
            <div className="flow-content">
              <h3>{t.flowStep1Title}</h3>
              <p>{t.flowStep1Desc}</p>
            </div>
          </div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">
            <div className="flow-number">2</div>
            <div className="flow-content">
              <h3>{t.flowStep2Title}</h3>
              <p>{t.flowStep2Desc}</p>
            </div>
          </div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">
            <div className="flow-number">3</div>
            <div className="flow-content">
              <h3>{t.flowStep3Title}</h3>
              <p>{t.flowStep3Desc}</p>
            </div>
          </div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">
            <div className="flow-number">4</div>
            <div className="flow-content">
              <h3>{t.flowStep4Title}</h3>
              <p>{t.flowStep4Desc}</p>
            </div>
          </div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">
            <div className="flow-number">5</div>
            <div className="flow-content">
              <h3>{t.flowStep5Title}</h3>
              <p>{t.flowStep5Desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel wallet">
        <div className="wallet-head">
          <div>
            <p className="eyebrow">{t.walletEyebrow}</p>
            <h2>{t.walletTitle}</h2>
            <p className="hint">{t.walletHint}</p>
          </div>
          <div className="wallet-actions">
            {walletAddress ? (
              <button className="button-secondary" onClick={disconnectWallet}>
                {t.walletDisconnect}
              </button>
            ) : (
              <button onClick={connectWallet}>{t.walletConnect}</button>
            )}
          </div>
        </div>
        <div className="wallet-meta">
          <span className="pill">Network: {stacksNetwork}</span>
          <span className="mono">
            {walletAddress ? `${t.walletConnected}: ${formatAddress(walletAddress)}` : t.walletNotConnected}
          </span>
        </div>
        {walletError ? <p className="error">{walletError}</p> : null}
      </section>

      <section className="panel">
        <div>
          <p className="eyebrow">{t.datasetEyebrow}</p>
          <h2>{t.datasetTitle}</h2>
          <p className="hint">{t.datasetHint}</p>
        </div>
        <div className="form-grid">
          <div className="form-row">
            <label className="label" htmlFor="title">
              {t.datasetLabelTitle}
            </label>
            <input
              id="title"
              value={dataset.title}
              onChange={(e) => setDataset({ ...dataset, title: e.target.value })}
              placeholder={t.datasetPlaceholderTitle}
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="url">
              {t.datasetLabelUrl}
            </label>
            <input
              id="url"
              value={dataset.url}
              onChange={(e) => setDataset({ ...dataset, url: e.target.value })}
              placeholder="https://example.com/report"
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="snippet">
              {t.datasetLabelSnippet}
            </label>
            <textarea
              id="snippet"
              value={dataset.snippet}
              onChange={(e) => setDataset({ ...dataset, snippet: e.target.value })}
              placeholder={t.datasetPlaceholderSnippet}
            />
          </div>
        </div>
        <div className="row">
          <button onClick={createDataset} disabled={creating || !walletAddress}>
            {creating ? t.datasetPublishing : t.datasetPublish}
          </button>
        </div>
        {createError ? <p className="error">{createError}</p> : null}
        {createSuccess ? <p className="success">{createSuccess}</p> : null}
      </section>

      <section className="panel agent-panel">
        <div className="agent-header">
          <div>
            <div className="agent-eyebrow-row">
              <p className="eyebrow">{'\uD83E\uDD16'} {t.agentEyebrow}</p>
              <div className="lang-toggle">
                <button
                  className={`lang-btn ${lang === 'id' ? 'lang-active' : ''}`}
                  onClick={() => setLang('id')}
                >
                  ID
                </button>
                <button
                  className={`lang-btn ${lang === 'en' ? 'lang-active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
              </div>
            </div>
            <h2>{t.agentTitle}</h2>
            <p className="hint">{t.agentHint}</p>
          </div>
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>{t.agentProcessing}</span>
            </div>
          )}
        </div>
        <label className="label" htmlFor="query">
          {t.agentLabelQuery}
        </label>
        <div className="row">
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                runAgent();
              }
            }}
            placeholder={t.agentPlaceholder}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
          <button onClick={runAgent} disabled={loading || !query.trim()} className="btn-primary">
            {loading ? t.agentRunning : t.agentRun}
          </button>
        </div>
      </section>

      <section className="grid">
        <div className="card logs-card">
          <div className="card-head">
            <h2>{'\uD83D\uDCCB'} {t.logsTitle}</h2>
            {result?.payment?.txid ? (
              <span className="pill pill-success">
                {'\u2713'} Paid: {result.payment.txid.slice(0, 8)}...
              </span>
            ) : null}
          </div>
          {result?.error ? <p className="error">{'\u274C'} Error: {result.error}</p> : null}
          <div className="logs-container">
            <ul className="logs">
              {logs.length ? (
                logs.map((log, index) => (
                  <li key={`${log.timestamp}-${index}`} className="log-entry">
                    <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="log-message">{log.message}</span>
                  </li>
                ))
              ) : (
                <li className="empty">{t.logsEmpty}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-head">
            <h2>{'\uD83D\uDCA1'} {t.summaryTitle}</h2>
            {summary && <span className="pill">{results.length} results</span>}
          </div>
          {summary ? (
            <div className="summary">
              <div className="summary-section">
                <h3>{'\uD83D\uDCCC'} {t.summaryBullets}</h3>
                <ul>
                  {summary.bullets.map((bullet, index) => (
                    <li key={`bullet-${index}`}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="summary-section">
                <h3>{'\uD83D\uDD0D'} {t.summaryInsights}</h3>
                <ul>
                  {summary.insights.map((insight, index) => (
                    <li key={`insight-${index}`}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="empty">{t.summaryEmpty}</p>
          )}
        </div>

        <div className="card results-card">
          <div className="card-head">
            <h2>{'\uD83D\uDDC2\uFE0F'} {t.resultsTitle}</h2>
            {groupedResults.length > 0 && (
              <span className="pill">{groupedResults.length} items</span>
            )}
          </div>
          <div className="results">
            {groupedResults.length ? (
              groupedResults.map((item, index) => (
                <article key={`${item.title}-${index}`} className="result-item">
                  <h3>{item.title}</h3>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {item.url}
                  </a>
                  <p>{item.snippet}</p>
                </article>
              ))
            ) : (
              <p className="empty">{t.resultsEmpty}</p>
            )}
          </div>
        </div>
      </section>

      <section className="output">
        <div className="output-head">
          <h2>{'\uD83D\uDCC4'} {t.rawTitle}</h2>
          <span className="pill">Debug Data</span>
        </div>
        <pre>{result ? JSON.stringify(result, null, 2) : t.rawWaiting}</pre>
      </section>

      {/* Info Footer */}
      <section className="info-footer">
        <div className="info-card">
          <h3>{'\uD83D\uDC8E'} {t.footerX402Title}</h3>
          <p>{t.footerX402Desc}</p>
        </div>
        <div className="info-card">
          <h3>{'\uD83E\uDD16'} {t.footerAgentTitle}</h3>
          <p>{t.footerAgentDesc}</p>
        </div>
        <div className="info-card">
          <h3>{'\u26A1'} {t.footerM2mTitle}</h3>
          <p>{t.footerM2mDesc}</p>
        </div>
      </section>
    </main>
  );
}
