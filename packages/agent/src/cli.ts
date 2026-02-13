import 'dotenv/config';
import { runAgent } from './index.js';

const args = process.argv.slice(2);
const qIndex = args.findIndex((arg) => arg === '--q' || arg === '-q');
const jsonOutput = args.includes('--json');
const query = qIndex >= 0 ? args[qIndex + 1] : '';
const prompt = qIndex >= 0 ? '' : args.join(' ');
const baseUrl = process.env.AGENT_BASE_URL ?? 'http://localhost:4000';

runAgent({ baseUrl, query, prompt })
  .then((result) => {
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (result.logs.length) {
      console.log('Logs:');
      for (const log of result.logs) {
        console.log(`[${log.timestamp}] ${log.message}`);
      }
      console.log('');
    }

    const items = result.data?.results ?? [];
    if (items.length) {
      console.log('Results:');
      items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   ${item.url}`);
        console.log(`   ${item.snippet}`);
      });
      console.log('');
    }

    if (result.summary) {
      console.log('Summary:');
      result.summary.bullets.forEach((bullet) => console.log(`- ${bullet}`));
      console.log('');
      console.log('Insights:');
      result.summary.insights.forEach((insight) => console.log(`- ${insight}`));
    }
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
