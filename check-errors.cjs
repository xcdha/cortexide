const WebSocket = require('ws');
const http = require('http');
async function main() {
  const data = await new Promise((res, rej) => {
    http.get('http://localhost:9222/json/list', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  });
  const match = data.match(/devtools\/page\/([A-F0-9]+)/);
  if (!match) { console.log('No page'); process.exit(1); }
  const ws = new WebSocket(`ws://localhost:9222/devtools/page/${match[1]}`);
  let id = 0;
  const pending = new Map();
  const messages = [];
  ws.on('message', msg => {
    const d = JSON.parse(msg);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Runtime.consoleAPICalled') {
      const type = d.params.type;
      const text = d.params.args.map(a => a.value || a.description || '').join(' ');
      messages.push(`[console.${type}] ${text.substring(0, 250)}`);
    }
    if (d.method === 'Runtime.exceptionThrown') { messages.push(`[exception] ${d.params.exceptionDetails.text}`); }
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') { messages.push(`[log.error] ${d.params.entry.text.substring(0, 250)}`); }
  });
  function send(method, params) { return new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); }); }
  ws.on('open', async () => {
    await send('Runtime.enable', {});
    await send('Log.enable', {});
    console.log('Waiting 10s...');
    await new Promise(r => setTimeout(r, 10000));
    const errors = messages.filter(m => m.includes('[console.error]') || m.includes('[exception]') || m.includes('[log.error]'));
    const seen = new Set();
    const unique = errors.filter(e => { const k = e.substring(0, 80); if (seen.has(k)) return false; seen.add(k); return true; });
    console.log('Total messages:', messages.length, 'Errors:', errors.length, 'Unique:', unique.length);
    if (unique.length === 0) console.log('NO ERRORS!');
    unique.forEach((e, i) => console.log(`${i + 1}: ${e}`));
    ws.close(); process.exit(0);
  });
  setTimeout(() => { console.log('timeout'); process.exit(1); }, 20000);
}
main();
