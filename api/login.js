let currentPassword = '123456';
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const crypto = require('crypto');
  const getBody = () => new Promise((resolve) => { const chunks = []; req.on('data', d => chunks.push(d)); req.on('end', () => { const raw = Buffer.concat(chunks).toString('utf-8'); try { resolve(JSON.parse(raw||'{}')); } catch (e) { resolve({}); } }); });
  const body = req.body || await getBody();
  if ((req.url || '').includes('/change-password')) {
    const { oldPassword, newPassword } = body || {};
    if (!oldPassword || !newPassword) { res.status(400).json({ error: 'required' }); return; }
    if (oldPassword !== currentPassword) { res.status(401).json({ error: 'invalid' }); return; }
    currentPassword = String(newPassword);
    res.status(200).json({ ok: true });
    return;
  }
  const { username, password } = body || {};
  if ((username || '') === 'admin' && (password || '') === currentPassword) { res.status(200).json({ user: 'admin', token: crypto.randomUUID() }); }
  else { res.status(401).json({ error: 'invalid' }); }
}