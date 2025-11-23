module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  const http = require('http');
  const url = new URL('http://inter.bak365.cn/Service.ashx?Type=GetTimeKay');
  const appNo = (req.query && (req.query.AppNo||req.query.appno)) || 'Test';
  url.searchParams.set('AppNo', appNo);
  const opts = { hostname: url.hostname, path: url.pathname + url.search, method: 'GET' };
  const chunks = [];
  const r2 = http.request(opts, (r) => {
    r.on('data', (d) => chunks.push(d));
    r.on('end', () => {
      const txt = Buffer.concat(chunks).toString('utf-8');
      let data = null;
      try { data = JSON.parse(txt || '{}'); } catch (e) { data = { State: false, Msg: '非JSON响应', Data: {}, raw: txt }; }
      res.status(200).json(data);
    });
  });
  r2.setTimeout(8000);
  r2.on('timeout', () => { try { res.status(504).json({ error: 'timeout' }); } catch(e){} r2.destroy(); });
  r2.on('error', () => { res.status(502).json({ error: 'upstream_error' }); });
  r2.end();
}