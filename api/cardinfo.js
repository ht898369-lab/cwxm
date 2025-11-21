module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const http = require('http');
  const crypto = require('crypto');
  const getBody = () => new Promise((resolve) => { const chunks = []; req.on('data', d => chunks.push(d)); req.on('end', () => { const raw = Buffer.concat(chunks).toString('utf-8'); try { resolve(JSON.parse(raw||'{}')); } catch (e) { resolve({}); } }); });
  try {
    const body = req.body || await getBody();
    const B1 = body && body.B1 || '';
    const cardNo = body && body.CardNo || '0001';
    if (!B1) { res.status(400).json({ error: 'B1_required' }); return; }
    const payloadStr = `{"CardNo":"${cardNo}"}`;
    const N1 = `Test123456${payloadStr}${B1}`;
    const M1 = crypto.createHash('md5').update(N1).digest('hex');
    const pathUrl = `/Service.ashx?AppNo=Test&Type=CardInfo&MAC=${encodeURIComponent(M1)}`;
    const postBody = Buffer.from(payloadStr, 'utf-8');
    const opts = { hostname: 'inter.bak365.cn', path: pathUrl, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': postBody.length } };
    const chunks = [];
    const r2 = http.request(opts, (r) => {
      r.on('data', (d) => chunks.push(d));
      r.on('end', () => {
        const txt = Buffer.concat(chunks).toString('utf-8');
        let resp = null; try { resp = JSON.parse(txt || '{}'); } catch (e) { resp = txt; }
        const C1 = `http://inter.bak365.cn${pathUrl}`;
        res.status(200).json({ req: { B1, N1, M1, C1, cardNo }, resp });
      });
    });
    r2.setTimeout(8000);
    r2.on('timeout', () => { try { res.status(504).json({ error: 'timeout' }); } catch(e){} r2.destroy(); });
    r2.on('error', () => { res.status(502).json({ error: 'upstream_error' }); });
    r2.write(postBody);
    r2.end();
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
}