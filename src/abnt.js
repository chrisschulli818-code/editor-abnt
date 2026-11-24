// Regras ABNT e utilitários puros (sem React).

const PRE = /^(resumo|abstract|agradecimentos|dedicat[óo]ria|ep[íi]grafe|sum[áa]rio|lista\b|folha de rosto|errata)/i;
const POS = /^(refer[êe]ncias|ap[êe]ndice|anexo|gloss[áa]rio|[íi]ndice)/i;
const NUM = /^(\d+(?:\.\d+)*)\s+(.*)$/;

// Família de etiqueta: pré-textual, textual ou pós-textual (estrutura da NBR 14724).
export function familia(texto) {
  const t = texto.trim();
  if (PRE.test(t)) return 'pre';
  if (POS.test(t)) return 'pos';
  return 'tex';
}

export function estrutura(ed) {
  return [...ed.querySelectorAll('h1,h2')]
    .filter(h => h.textContent.trim())
    .map(el => {
      const raw = el.textContent.trim(), m = raw.match(NUM);
      return { el, nivel: el.tagName === 'H1' ? 1 : 2, fam: familia(m ? m[2] : raw), num: m ? m[1] : '', titulo: m ? m[2] : raw };
    });
}

// Distância do topo da folha em unidades de layout (independe do zoom da tela).
export function topo(el, raiz) {
  let y = 0;
  for (let n = el; n && n !== raiz; n = n.offsetParent) y += n.offsetTop;
  return y;
}

// Verificador: usa o estilo calculado, então pega o que o usuário mudou e o que veio colado.
export function verificar(ed) {
  const out = [], vistos = new Set();
  const add = (el, curto, longo) => { const k = curto + '|' + topo(el, ed); if (!vistos.has(k)) { vistos.add(k); out.push({ el, curto, longo, y: topo(el, ed) }); } };
  ed.querySelectorAll('p,h1,h2,li,td,blockquote,span,font,b,i,u,div').forEach(n => {
    if (!n.textContent.trim()) return;
    const cs = getComputedStyle(n), pt = parseFloat(cs.fontSize) * .75, cit = n.closest('blockquote');
    const alvo = cit ? 10 : 12;
    if (Math.abs(pt - alvo) > .3) add(n, `${pt.toFixed(0)} pt · norma ${alvo}`, `Fonte em ${pt.toFixed(0)} pt; a ABNT pede ${alvo} pt${cit ? ' em citação longa' : ''}.`);
    if (!/Times New Roman|Arial/i.test(cs.fontFamily)) add(n, 'fonte', 'A fonte deve ser Times New Roman ou Arial.');
    if (!cit && n.matches('p,li') && Math.abs(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) - 1.5) > .05) add(n, 'entrelinha ≠ 1,5', 'O espaçamento entre linhas deve ser 1,5.');
  });
  estrutura(ed).forEach(h => {
    if (h.fam === 'tex' && !h.num) add(h.el, 'sem número', 'Seção textual sem numeração progressiva (NBR 6024).');
    if (h.fam !== 'tex' && h.num) add(h.el, 'não numerar', 'Elementos pré e pós-textuais não levam número de seção.');
  });
  return out;
}

const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const paragrafos = t => t.split(/\n+/).map(l => `<p>${esc(l)}</p>`).join('');

// Diff por palavras (LCS). Devolve [{t, k}] com k = '=' | '+' | '-'.
export function diff(a, b) {
  const x = a.split(/(\s+)/), y = b.split(/(\s+)/), n = x.length, m = y.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && x[i] === y[j]) out.push({ t: x[i++], k: '=' }), j++;
    else if (i < n && (j === m || L[i + 1][j] >= L[i][j + 1])) out.push({ t: x[i++], k: '-' });
    else out.push({ t: y[j++], k: '+' });
  }
  return out;
}

export const MODELO = `<p style="text-align:center;text-indent:0">NOME DA INSTITUIÇÃO</p><p style="text-align:center;text-indent:0">AUTOR</p>
<p style="text-align:center;text-indent:0"><b>TÍTULO DO TRABALHO</b></p><p style="text-align:center;text-indent:0">Cidade<br>Ano</p>
<h1>Resumo</h1><p>Texto do resumo.</p><h1>1 Introdução</h1><p>Texto da introdução.</p><h2>1.1 Objetivos</h2><p>Texto.</p>
<h1>Referências</h1><p style="text-indent:0">SOBRENOME, Nome. <b>Título</b>. Cidade: Editora, ano.</p>`;

// shortcut: .doc em HTML (o Word abre normalmente), não é .docx real; trocar pela lib "docx" quando precisar de fidelidade.
export function baixarDoc(html, nome) {
  const css = 'body{font:12pt "Times New Roman"} p{line-height:150%;text-indent:1.25cm;text-align:justify;margin:0} h1{font-size:12pt;text-transform:uppercase}';
  const doc = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>${css} @page{size:21cm 29.7cm;margin:3cm 2cm 2cm 3cm}</style></head><body>${html}</body></html>`;
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([doc], { type: 'application/msword' })), download: (nome || 'trabalho') + '.doc' });
  a.click();
  URL.revokeObjectURL(a.href);
}
