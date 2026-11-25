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

// Seção Referências: itens = parágrafos depois do título, até a próxima seção.
export function secaoRefs(ed) {
  const h = [...ed.querySelectorAll('h1')].find(h => /^refer[êe]ncias/i.test(h.textContent.trim()));
  const itens = [];
  for (let n = h?.nextElementSibling; n && !/^H[12]$/.test(n.tagName); n = n.nextElementSibling) if (n.textContent.trim()) itens.push(n);
  return { h, itens };
}
const sem = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const CIT = /\(([A-ZÀ-Ý][A-ZÀ-Ý'\- ;]*?),\s*\d{4}[a-z]?[^)]*\)/g; // (SOBRENOME, 2020) e (A; B, 2020)

// Verificador: usa o estilo calculado, então pega o que o usuário mudou e o que veio colado.
export function verificar(ed) {
  const out = [], vistos = new Set();
  const add = (el, curto, longo) => { const k = curto + '|' + topo(el, ed); if (!vistos.has(k)) { vistos.add(k); out.push({ el, curto, longo, y: topo(el, ed) }); } };
  ed.querySelectorAll('p,h1,h2,li,td,blockquote,span,font,b,i,u,div').forEach(n => {
    if (!n.textContent.trim()) return;
    const cs = getComputedStyle(n), pt = parseFloat(cs.fontSize) * .75, cit = n.closest('blockquote, .leg');
    const alvo = cit ? 10 : 12;
    if (Math.abs(pt - alvo) > .3) add(n, `${pt.toFixed(0)} pt · norma ${alvo}`, `Fonte em ${pt.toFixed(0)} pt; a ABNT pede ${alvo} pt${cit ? ' em citação longa ou legenda' : ''}.`);
    if (!/Times New Roman|Arial/i.test(cs.fontFamily)) add(n, 'fonte', 'A fonte deve ser Times New Roman ou Arial.');
    if (!cit && !n.closest('.simples') && n.matches('p,li') && Math.abs(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) - 1.5) > .05) add(n, 'entrelinha ≠ 1,5', 'O espaçamento entre linhas deve ser 1,5.');
  });
  estrutura(ed).forEach(h => {
    if (h.fam === 'tex' && !h.num) add(h.el, 'sem número', 'Seção textual sem numeração progressiva (NBR 6024).');
    if (h.fam !== 'tex' && h.num) add(h.el, 'não numerar', 'Elementos pré e pós-textuais não levam número de seção.');
  });

  // NBR 6023: referências alinhadas à esquerda e em ordem alfabética (sistema autor-data).
  const { h: hr, itens } = secaoRefs(ed);
  itens.forEach(p => { const a = getComputedStyle(p).textAlign; if (a !== 'left' && a !== 'start') add(p, 'alinhar à esq.', 'Referências são alinhadas só à margem esquerda (NBR 6023).'); });
  const chave = p => p.textContent.trim().split(/[.,]/)[0];
  for (let i = 1; i < itens.length; i++) if (chave(itens[i - 1]).localeCompare(chave(itens[i]), 'pt', { sensitivity: 'base' }) > 0) add(itens[i], 'ordem alfabética', 'No sistema autor-data, as referências seguem a ordem alfabética (NBR 6023).');

  // NBR 10520: citação direta com mais de 3 linhas em bloco; citação (SOBRENOME, ano) precisa de referência.
  // shortcut: só reconhece o sistema autor-data com sobrenome em maiúsculas e citação que ocupa o parágrafo todo; ampliar quando houver demanda.
  const autores = itens.map(p => sem(p.textContent));
  ed.querySelectorAll('p,blockquote,li,td').forEach(n => {
    if (n.querySelector('p,blockquote,li,td') || itens.includes(n) || n.closest('.sumario,.lista-ilus')) return;
    const t = n.textContent.trim(), cs = getComputedStyle(n);
    if (!n.closest('blockquote, .leg, .simples') && /^["“]/.test(t) && /["”]\s*(\([^)]*\))?\.?$/.test(t) && n.offsetHeight / parseFloat(cs.lineHeight) > 3.2)
      add(n, 'citação longa', 'Citação direta com mais de 3 linhas vai em bloco recuado 4 cm, fonte 10 (NBR 10520).');
    for (const m of t.matchAll(CIT)) {
      if (!hr) { add(n, 'sem Referências', 'Há citação, mas o trabalho não tem a seção Referências.'); break; }
      const falta = m[1].split(';').map(sem).find(a => a && !autores.some(r => r.startsWith(a)));
      if (falta) { add(n, 'sem referência', `A citação de ${falta.toUpperCase()} não aparece nas Referências.`); break; }
    }
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
<h1>Referências</h1><p style="text-indent:0;text-align:left">SOBRENOME, Nome. <b>Título</b>. Cidade: Editora, ano.</p>`;

// Folha: 1 cm = 37,795 px. Página impressa = 24,7 cm de texto (A4 menos margens 3 + 2 cm), começando após a margem superior.
export const TOPO = 3 * 37.795, PG = 24.7 * 37.795;
// shortcut: a página é estimada pela altura; quebras de linha do PDF podem deslocar um título. Conferir no PDF.
export const paginaDe = (el, ed) => Math.max(1, Math.floor((topo(el, ed) - TOPO) / PG) + 1);

const bloco = (cls, titulo, linhas, attr = '') => `<div class="${cls}"${attr}><p style="text-align:center;text-indent:0"><b>${titulo}</b></p>${linhas}</div>`;
const itemDe = (el, ed, texto, nivel = 0) => `<p class="sum-i" style="text-indent:0;text-align:left;padding-left:${nivel * 0.6}cm"><span>${esc(texto)}</span><i></i><span>${paginaDe(el, ed)}</span></p>`;

export function htmlSumario(ed) {
  const itens = estrutura(ed).filter(h => h.fam !== 'pre');
  return bloco('sumario', 'SUMÁRIO', itens.map(h => itemDe(h.el, ed, (h.num ? h.num + ' ' : '') + h.titulo, h.nivel - 1)).join(''));
}
// tipo: 'Figura' | 'Tabela'
export function htmlLista(ed, tipo) {
  const itens = [...ed.querySelectorAll(`.leg[data-k="${tipo}"]`)];
  return bloco('lista-ilus', tipo === 'Tabela' ? 'LISTA DE TABELAS' : 'LISTA DE ILUSTRAÇÕES', itens.map(el => itemDe(el, ed, el.textContent.trim())).join(''), ` data-k="${tipo}"`);
}
// shortcut: o número vem da contagem atual; inserir uma legenda no meio não renumera as outras, então ajuste à mão.
export function htmlLegenda(ed, tipo) {
  const n = ed.querySelectorAll(`.leg[data-k="${tipo}"]`).length + 1;
  return `<p class="leg" data-k="${tipo}" style="text-align:center;text-indent:0;font-size:10pt;line-height:1">${tipo} ${n} – Título</p>`;
}

// Capa e folha de rosto (NBR 14724): linhas em branco fazem o papel do espaçamento vertical.
export function htmlCapa(d) {
  const c = (t, extra = '') => `<p style="text-align:center;text-indent:0;${extra}">${t}</p>`;
  const v = n => '<p style="text-indent:0"><br></p>'.repeat(n);
  const E = x => esc(x || '');
  const rosto = `${c(E(d.autor))}${v(10)}${c('<b>' + E(d.titulo).toUpperCase() + '</b>')}${v(4)}`
    + (d.natureza ? `<p class="simples" style="margin-left:8cm;text-indent:0;text-align:justify;line-height:1">${E(d.natureza)}${d.orientador ? '<br><br>Orientador: ' + E(d.orientador) : ''}</p>` : '')
    + `${v(d.natureza ? 6 : 10)}${c(E(d.cidade))}${c(E(d.ano), 'page-break-after:always')}`;
  return `<div class="capa">${c(E(d.inst).toUpperCase())}${c(E(d.autor))}${v(14)}${c('<b>' + E(d.titulo).toUpperCase() + '</b>')}${v(14)}${c(E(d.cidade))}${c(E(d.ano), 'page-break-after:always')}</div><div class="rosto">${rosto}</div>`;
}

// Arquivo aberto pelo usuário: remove scripts e atributos de evento antes de entrar na página.
export function limpar(html) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  d.querySelectorAll('script,style,iframe,object,embed,link,meta,form,base').forEach(n => n.remove());
  d.body.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => {
    if (/^on/i.test(a.name) || (/^(href|src|xlink:href|formaction)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name);
  }));
  return d.body.innerHTML;
}

export async function baixar(blob, nome) {
  // Em artefato do Claude o download direto é bloqueado: usa o recurso "downloads".
  const dl = await window.claude?.use?.('downloads').catch(() => null);
  if (dl) { await dl.save({ filename: nome, data: blob }).catch(() => {}); return; }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: nome });
  a.click();
  URL.revokeObjectURL(a.href);
}
