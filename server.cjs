// Servidor mínimo: arquivos estáticos + proxy para a IA (a chave nunca vai ao navegador).
const http = require('http'), fs = require('fs'), path = require('path');
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.MODEL || 'gemini-2.5-flash';
const PUB = path.join(__dirname, 'dist'); // saída do vite build

async function formalizar(texto) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'Reescreva o texto do usuário em português formal e acadêmico, mantendo o sentido, os fatos e os parágrafos. Não adicione informações. Responda somente com o texto reescrito.' }] },
      contents: [{ role: 'user', parts: [{ text: texto }] }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'Erro na API');
  const out = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('');
  if (!out) throw new Error('A IA não devolveu texto (conteúdo bloqueado ou vazio).');
  return out;
}

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/formalizar') {
    let body = '';
    for await (const c of req) body += c;
    try {
      if (!KEY) throw new Error('Defina GEMINI_API_KEY antes de iniciar o servidor.');
      const { texto } = JSON.parse(body);
      if (!texto || texto.length > 20000) throw new Error('Texto vazio ou maior que 20.000 caracteres.');
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ texto: await formalizar(texto) }));
    } catch (e) {
      res.statusCode = 400;
      res.end(JSON.stringify({ erro: e.message }));
    }
    return;
  }
  const f = path.join(PUB, req.url === '/' ? 'index.html' : path.normalize(req.url.split('?')[0]));
  if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('content-type', { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('servidor no ar'));
