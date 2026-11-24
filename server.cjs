// Servidor mínimo: arquivos estáticos + proxy para a IA (a chave nunca vai ao navegador).
const http = require('http'), fs = require('fs'), path = require('path');
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.MODEL || 'gemini-3.8-flash';
const PUB = path.join(__dirname, 'dist'); // saída do vite build

const BASE = ' Responda somente com o texto resultante, sem comentários.';
const MODOS = {
  formalizar: 'Reescreva o texto do usuário em português formal e acadêmico, mantendo o sentido, os fatos e os parágrafos. Não adicione informações.',
  corrigir: 'Corrija ortografia, acentuação, pontuação, concordância e regência do texto do usuário, sem mudar o estilo, o sentido nem a estrutura.',
  resumir: 'Resuma o texto do usuário em português acadêmico, em um único parágrafo, mantendo as ideias principais. Não adicione informações.',
  ampliar: 'Desenvolva o texto do usuário em português formal e acadêmico, explicando melhor as ideias já presentes. Não invente fatos, dados, números nem citações.',
  terceira: 'Reescreva o texto do usuário em terceira pessoa e voz impessoal (sem "eu" nem "nós"), em português formal. Altere apenas a pessoa gramatical: preserve cada afirmação, opinião, dado e nível de certeza como estão, sem reinterpretar, generalizar nem trocar conceitos (por exemplo, "eu estava certo" deve virar "estava correto", e não "a hipótese estava correta"). Não acrescente nem remova ideias.',
};

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALHAS = [404, 429, 503]; // modelo fechado, sem cota ou sobrecarregado: vale tentar outro

// Pergunta ao Google quais modelos de texto a chave acessa: estáveis primeiro, "lite" e "preview" por último. Guarda por 1 h.
let lista = null;
async function descobrir() {
  if (lista) return lista;
  try {
    const j = await (await fetch(`${API}?pageSize=200`, { headers: { 'x-goog-api-key': KEY }, signal: AbortSignal.timeout(8000) })).json();
    const nota = n => (/lite/.test(n) ? 2 : 0) + (/preview|exp|omni/.test(n) ? 1 : 0);
    lista = (j.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent') && /flash/.test(m.name) && !/image|live|tts|audio|embed|learnlm|robotics|computer/.test(m.name))
      .map(m => m.name.replace('models/', '')).sort((x, y) => nota(x) - nota(y) || y.localeCompare(x));
    console.log('modelos disponíveis:', lista.join(', '));
    setTimeout(() => { lista = null; }, 3600000).unref();
  } catch { return []; }
  return lista;
}

// Cada tentativa tem 10 s; se o Google não responde, conta como sobrecarga (503) e passa para o próximo modelo.
async function chamar(m, texto, modo) {
  const r = await fetch(`${API}/${m}:generateContent`, {
    signal: AbortSignal.timeout(10000),
    method: 'POST',
    headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: MODOS[modo] + BASE }] },
      contents: [{ role: 'user', parts: [{ text: texto }] }],
    }),
  });
  return [r, await r.json()];
}
const tentar = (m, texto, modo) => chamar(m, texto, modo).catch(e => [{ ok: false, status: 503 }, { error: { message: String(e.name) } }]);

async function formalizar(texto, modo) {
  const t0 = Date.now();
  let [r, j] = await tentar(MODEL, texto, modo);
  if (!r.ok && FALHAS.includes(r.status)) {
    console.error('gemini', MODEL, r.status, j.error?.message);
    for (const m of (await descobrir()).filter(x => x !== MODEL).slice(0, 8)) { // até 8 alternativas
      if (Date.now() - t0 > 30000) break; // orçamento total: o aluno não espera mais que isso
      [r, j] = await tentar(m, texto, modo);
      if (r.ok || !FALHAS.includes(r.status)) { if (r.ok) console.log('respondeu com', m); break; }
      console.error('gemini', m, r.status, j.error?.message);
    }
  }
  if (!r.ok) {
    console.error('gemini', r.status, j.error?.message); // o detalhe fica no log do servidor, não vai ao navegador
    throw new Error(r.status === 429 ? 'A IA atingiu o limite de uso. Tente de novo em instantes.'
      : r.status === 400 || r.status === 403 ? 'A IA não está configurada corretamente neste servidor.'
      : 'A IA está indisponível agora. Tente de novo.');
  }
  const out = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('');
  if (!out) throw new Error('A IA não devolveu texto (conteúdo bloqueado ou vazio).');
  return out;
}

// Limite por IP (8/min) e global (300/h): protege a chave num site público.
// O IP vem do fim do x-forwarded-for, a parte que o proxy do Render acrescenta (o início o cliente pode forjar).
const LIM = new Map(); let hora = { t: 0, n: 0 };
const ipDe = req => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();
function excedeu(ip) {
  const t = Date.now(), a = (LIM.get(ip) || []).filter(x => t - x < 60000); a.push(t); LIM.set(ip, a);
  if (t - hora.t > 3600000) hora = { t, n: 0 };
  return a.length > 8 || ++hora.n > 300;
}
setInterval(() => LIM.clear(), 600000).unref();

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/formalizar') {
    res.setHeader('content-type', 'application/json');
    try {
      if (excedeu(ipDe(req))) { res.statusCode = 429; return res.end(JSON.stringify({ erro: 'Muitas requisições. Aguarde um minuto.' })); }
      let body = '';
      for await (const c of req) { body += c; if (body.length > 100000) throw new Error('Pedido grande demais.'); }
      if (!KEY) throw new Error('A IA não está configurada neste servidor.');
      const { texto, modo = 'formalizar' } = JSON.parse(body);
      if (!MODOS[modo]) throw new Error('Modo desconhecido.');
      if (typeof texto !== 'string' || !texto.trim() || texto.length > 20000) throw new Error('Texto vazio ou maior que 20.000 caracteres.');
      res.end(JSON.stringify({ texto: await formalizar(texto, modo) }));
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
