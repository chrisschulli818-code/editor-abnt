import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Library, FileDown, FileText, Check, X, Save, FolderOpen, Minus, Plus } from 'lucide-react';
import { estrutura, verificar, diff, paragrafos, baixar, limpar, htmlSumario, htmlLista, htmlLegenda, htmlCapa, paginaDe, TOPO, PG, MODELO } from './abnt.js';
import { baixarDocx } from './docx.js';
import Faixa from './Faixa.jsx';

const NOME_FAM = { pre: 'Pré-textual', tex: 'Textual', pos: 'Pós-textual' };
const FOLHA = 793; // 21 cm em px CSS
const GUTTER = 150; // coluna dos avisos, à direita da folha
const CHAVE = 'abnt-doc';
const FMT0 = { fonte: 'Times New Roman', tam: 12, lh: 1.5, al: 'justify', bloco: 'p' };
const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MODOS = { formalizar: 'Formalizar', corrigir: 'Corrigir', resumir: 'Resumir', ampliar: 'Ampliar', terceira: '3ª pessoa' };

export default function App() {
  const ed = useRef(null), bench = useRef(null), saved = useRef(null), fileIn = useRef(null), abrirIn = useRef(null), capaRef = useRef(null);
  const salvo = useRef((() => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } })());
  const [titulo, setTitulo] = useState(salvo.current.titulo || 'Meu trabalho');
  const deb = useRef();
  const [secoes, setSecoes] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [ajuste, setAjuste] = useState(1), [zoomU, setZoomU] = useState(null); // ajuste = zoom que cabe na tela; zoomU = escolha do usuário
  const zoom = zoomU ?? ajuste;
  const [sug, setSug] = useState(null); // { orig, texto, range }
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const [semSalvar, setSemSalvar] = useState(false);
  const [pergunta, setPergunta] = useState(null); // { msg, acao }: confirmação inline na barra
  const [modo, setModo] = useState('formalizar');
  const [paginas, setPaginas] = useState(1), [pag, setPag] = useState(1), [pal, setPal] = useState(0), [car, setCar] = useState(0), [rev, setRev] = useState(0);
  const [aba, setAba] = useState('Início'), [fmt, setFmt] = useState(FMT0);
  const [guias, setGuias] = useState(true), [avisosM, setAvisosM] = useState(true), [quebras, setQuebras] = useState(true), [lateral, setLateral] = useState(true), [ortografia, setOrtografia] = useState(true);
  const [achar, setAchar] = useState(false), [q, setQ] = useState(''), [rep, setRep] = useState('');

  const tituloRef = useRef(titulo); tituloRef.current = titulo;
  const analisar = useCallback(() => {
    if (!ed.current) return;
    setSecoes(estrutura(ed.current));
    setAvisos(verificar(ed.current));
    setPaginas(Math.max(1, Math.ceil((ed.current.offsetHeight - TOPO - 75.6 - 2) / PG)));
    const t = ed.current.innerText.trim(); setPal(t ? t.split(/\s+/).length : 0); setCar(t.replace(/\n/g, '').length); setRev(n => n + 1);
    try { localStorage.setItem(CHAVE, JSON.stringify({ html: ed.current.innerHTML, titulo: tituloRef.current })); setSemSalvar(false); } catch { setSemSalvar(true); } // cota cheia (fotos grandes): avisa em vez de falhar calado
  }, []);
  const agendar = () => { clearTimeout(deb.current); deb.current = setTimeout(analisar, 200); }; // digitação: evita recalcular a cada tecla

  useEffect(() => {
    ed.current.innerHTML = salvo.current.html || MODELO;
    document.execCommand('styleWithCSS', false, true);
    analisar();
  }, [analisar]);

  // Formato sob o cursor: acende os botões e preenche fonte, tamanho e espaçamento como o Word.
  const lerFmt = useCallback(sel => {
    const q = c => { try { return document.queryCommandState(c); } catch { return false; } };
    const n = sel.anchorNode, el = n.nodeType === 1 ? n : n.parentElement;
    if (!el) return;
    const bl = el.closest('h1,h2,blockquote,li,p,td') || el, cs = getComputedStyle(el), bs = getComputedStyle(bl);
    const novo = {
      b: q('bold'), i: q('italic'), u: q('underline'), s: q('strikeThrough'), sub: q('subscript'), sup: q('superscript'), ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
      al: bs.textAlign === 'start' ? 'left' : bs.textAlign, bloco: bl.tagName.toLowerCase(),
      fonte: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), tam: Math.round(parseFloat(cs.fontSize) * .75),
      lh: Math.round(parseFloat(bs.lineHeight) / parseFloat(bs.fontSize) * 100) / 100 || 1.5,
    };
    setFmt(p => (JSON.stringify(p) === JSON.stringify(novo) ? p : novo));
    setPag(paginaDe(bl, ed.current));
  }, []);

  // Seleção guardada: clicar em botões ou selects a perderia.
  useEffect(() => {
    const f = () => {
      const s = getSelection();
      if (s.rangeCount && ed.current?.contains(s.anchorNode)) { saved.current = s.getRangeAt(0).cloneRange(); lerFmt(s); }
    };
    document.addEventListener('selectionchange', f);
    return () => document.removeEventListener('selectionchange', f);
  }, [lerFmt]);

  useEffect(() => { // Ctrl+H abre localizar e substituir, como no Word
    const k = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') { e.preventDefault(); setAchar(true); } };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);

  // Ajusta a folha à largura disponível, reservando a coluna dos avisos.
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setAjuste(Math.min(1, (e.contentRect.width - 48) / (FOLHA + (e.contentRect.width < 700 || !avisosM ? 0 : GUTTER)))));
    ro.observe(bench.current);
    return () => ro.disconnect();
  }, [avisosM]);

  useEffect(() => { const t = setTimeout(analisar, 0); return () => clearTimeout(t); }, [analisar, zoom, titulo]);

  const foco = () => {
    ed.current.focus();
    if (saved.current) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved.current); }
  };
  const exec = (c, v) => { foco(); document.execCommand(c, false, v); analisar(); };
  const tamanho = pt => { // fontSize só aceita 1-7: marca com 7 e troca pelo tamanho real
    exec('fontSize', 7);
    ed.current.querySelectorAll('[style*="xxx-large"],[style*="xx-large"]').forEach(n => { n.style.fontSize = pt + 'pt'; });
    analisar();
  };
  const linha = v => { // espaçamento só nos parágrafos da seleção
    foco(); const r = saved.current;
    if (r) [...ed.current.querySelectorAll('p,h1,h2,li,blockquote')].filter(b => r.intersectsNode(b)).forEach(b => { b.style.lineHeight = v; });
    analisar();
  };
  const estilo = tag => exec('formatBlock', tag);
  const tabela = t => { const [l, c] = t.split('x').map(Number); colocar('<table>' + `<tr>${'<td>&nbsp;</td>'.repeat(c)}</tr>`.repeat(l) + '</table><p><br></p>'); analisar(); };

  // Localizar e substituir. shortcut: só acha texto dentro de um mesmo nó (uma palavra com negrito no meio não casa); ampliar se for preciso.
  const ocorr = useMemo(() => (achar && q ? (ed.current.innerText.match(new RegExp(escRe(q), 'gi')) || []).length : 0), [achar, q, rev]);
  function proximo() {
    const w = document.createTreeWalker(ed.current, NodeFilter.SHOW_TEXT), ns = [];
    while (w.nextNode()) ns.push(w.currentNode);
    if (!q || !ns.length) return;
    const r0 = saved.current, ok = r0 && ns.includes(r0.endContainer), ini = ok ? ns.indexOf(r0.endContainer) : 0, k = q.toLowerCase();
    for (let j = 0; j <= ns.length; j++) {
      const i = (ini + j) % ns.length, p = ns[i].nodeValue.toLowerCase().indexOf(k, j === 0 && ok ? r0.endOffset : 0);
      if (p < 0) continue;
      const r = document.createRange(); r.setStart(ns[i], p); r.setEnd(ns[i], p + q.length);
      ed.current.focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      ns[i].parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
  }
  function trocarTudo() {
    if (!q) return;
    const w = document.createTreeWalker(ed.current, NodeFilter.SHOW_TEXT), ns = [], re = new RegExp(escRe(q), 'gi');
    while (w.nextNode()) ns.push(w.currentNode);
    ns.forEach(t => { t.nodeValue = t.nodeValue.replace(re, () => rep); });
    analisar();
  }

  const substituir = (msg, acao) => (ed.current.innerText.trim() ? setPergunta({ msg, acao: () => { setPergunta(null); acao(); } }) : acao()); // evita apagar o trabalho sem perguntar
  const modelo = () => substituir('Substituir o texto atual?', () => { ed.current.innerHTML = MODELO; analisar(); });

  // Backup: o trabalho inteiro num arquivo .json que se abre depois (ou em outro computador).
  const backup = () => baixar(new Blob([JSON.stringify({ titulo, html: ed.current.innerHTML })], { type: 'application/json' }), (titulo || 'trabalho') + '.json');
  async function abrir(e) {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (typeof j.html !== 'string') throw 0;
      substituir('Substituir o trabalho atual pelo arquivo?', () => { ed.current.innerHTML = limpar(j.html); setTitulo(String(j.titulo || 'Meu trabalho')); analisar(); });
    } catch { setErro('Arquivo inválido: abra um .json salvo por este editor.'); }
  }

  // Blocos gerados (sumário, listas, legendas) entram depois do bloco do cursor; insertHTML do navegador funde e perde classes.
  const colocar = html => {
    let c = saved.current && ed.current.contains(saved.current.startContainer) ? saved.current.startContainer : null;
    while (c && c.parentNode !== ed.current) c = c.parentNode;
    const alvo = c?.nodeType === 1 ? c : ed.current.querySelector('.rosto');
    if (alvo) alvo.insertAdjacentHTML('afterend', html); else ed.current.insertAdjacentHTML('afterbegin', html);
  };
  const bloco = (sel, html) => { const a = ed.current.querySelector(sel); if (a) a.outerHTML = html; else colocar(html); }; // já existe: atualiza no lugar
  function inserir(k) {
    const e = ed.current;
    if (k === 'capa') return capaRef.current.showModal();
    if (k === 'quebra') { colocar('<p class="pb" style="text-indent:0;page-break-after:always"><br></p>'); return analisar(); }
    if (k === 'sumario') { bloco('.sumario', htmlSumario(e)); bloco('.sumario', htmlSumario(e)); } // 2ª passada: o próprio sumário muda as páginas
    else if (k === 'lista-Figura' || k === 'lista-Tabela') { const t = k.slice(6); bloco(`.lista-ilus[data-k="${t}"]`, htmlLista(e, t)); }
    else colocar(htmlLegenda(e, k));
    analisar();
  }
  function aplicarCapa(ev) {
    const d = Object.fromEntries(new FormData(ev.currentTarget));
    ed.current.querySelectorAll('.capa,.rosto').forEach(n => n.remove());
    ed.current.insertAdjacentHTML('afterbegin', htmlCapa(d));
    analisar();
  }
  const imagem = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => exec('insertImage', r.result); r.readAsDataURL(f); e.target.value = '';
  };

  async function formalizar() {
    const r = saved.current && !saved.current.collapsed ? saved.current : null;
    const orig = r ? r.toString() : ed.current.innerText;
    if (!orig.trim()) { setErro('Selecione um trecho ou escreva algo para formalizar.'); return; }
    setBusy(true); setErro('');
    try {
      const res = await fetch('/api/formalizar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texto: orig, modo }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.erro);
      setSug({ orig, texto: j.texto, range: r });
    } catch (e) { setErro(e.message || 'Não foi possível formalizar.'); }
    setBusy(false);
  }
  function aceitar() {
    // execCommand entra na pilha do navegador: Desfazer (Ctrl+Z) devolve o texto original.
    ed.current.focus();
    const s = getSelection(); s.removeAllRanges();
    if (sug.range) { s.addRange(sug.range); document.execCommand('insertText', false, sug.texto.replace(/\s*\n+\s*/g, ' ')); }
    else { s.selectAllChildren(ed.current); document.execCommand('insertHTML', false, paragrafos(sug.texto)); } // shortcut: o texto inteiro perde a formatação inline
    setSug(null); analisar();
  }
  // Avisos na mesma altura viram um chip só, para não se sobreporem.
  const chips = useMemo(() => {
    const g = new Map();
    avisos.forEach(a => { const k = Math.round(a.y / 22); (g.get(k) || g.set(k, { y: a.y, el: a.el, t: [] }).get(k)).t.push(a.curto); });
    return [...g.values()].map(c => ({ ...c, texto: c.t[0] + (c.t.length > 1 ? ` +${c.t.length - 1}` : ''), todos: c.t.join(' · ') }));
  }, [avisos]);
  const ir = el => el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><Library size={22} strokeWidth={1.75} aria-hidden /> <span>Editor ABNT</span></div>
        <input className="doc-title" value={titulo} onChange={e => setTitulo(e.target.value)} aria-label="Título do documento" />
        <div className="top-actions">
          {semSalvar && <span className="aviso-salvar" role="status">Não foi possível salvar: exporte o trabalho.</span>}
          <button className="aviso-cont" onClick={() => document.querySelector('.side').scrollIntoView({ behavior: 'smooth' })} title="Ver avisos da ABNT">{avisos.length ? `${avisos.length} aviso${avisos.length > 1 ? 's' : ''}` : 'Sem avisos'} · ≈{paginas} pág.</button>
          <button className="ghost" aria-label="Backup" onClick={backup} title="Baixar uma cópia do trabalho (.json)"><Save size={16} aria-hidden /> <span className="lbl">Backup</span></button>
          <button className="ghost" aria-label="Abrir" onClick={() => abrirIn.current.click()} title="Abrir um trabalho salvo (.json)"><FolderOpen size={16} aria-hidden /> <span className="lbl">Abrir</span></button>
          <input ref={abrirIn} type="file" accept=".json,application/json" hidden onChange={abrir} />
          <button className="ghost" aria-label="Exportar para Word" onClick={() => baixarDocx(ed.current, titulo).catch(() => setErro('Não foi possível gerar o Word.'))}><FileText size={16} aria-hidden /> <span className="lbl">Word</span></button>
          <button className="ghost" aria-label="Exportar para PDF" onClick={() => window.print()}><FileDown size={16} aria-hidden /> <span className="lbl">PDF</span></button>
        </div>
      </header>

      <Faixa aba={aba} setAba={setAba} fmt={fmt} modo={modo} setModo={setModo} MODOS={MODOS} busy={busy} onIA={formalizar}
        a={{ exec, tamanho, linha, cor: exec, bloco: estilo, inserir, tabela, modelo, abrirImagem: () => fileIn.current.click(), achar: () => setAchar(true),
          irAvisos: () => { setLateral(true); setTimeout(() => document.querySelector('.side').scrollIntoView({ behavior: 'smooth' }), 0); } }}
        v={{ zoomU, setZoomU, zoom, guias, setGuias, avisosM, setAvisosM, quebras, setQuebras, lateral, setLateral, ortografia, setOrtografia }} />
      <input ref={fileIn} type="file" accept="image/*" hidden onChange={imagem} />
      {pergunta && (
        <div className="barra" role="alertdialog" aria-label="Confirmar" onKeyDown={e => e.key === 'Escape' && setPergunta(null)}>
          <span>{pergunta.msg}</span>
          <button className="primary" autoFocus onClick={pergunta.acao}>Substituir</button>
          <button className="ghost" onClick={() => setPergunta(null)}>Cancelar</button>
        </div>
      )}
      {achar && (
        <div className="barra" role="search" aria-label="Localizar e substituir" onKeyDown={e => e.key === 'Escape' && setAchar(false)}>
          <label>Localizar <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && proximo()} /></label>
          <label>Substituir por <input value={rep} onChange={e => setRep(e.target.value)} /></label>
          <span className="cont" aria-live="polite">{q ? `${ocorr} ${ocorr === 1 ? 'ocorrência' : 'ocorrências'}` : '—'}</span>
          <button className="ghost" onClick={proximo} disabled={!q}>Próxima</button>
          <button className="ghost" onClick={trocarTudo} disabled={!q || !ocorr}>Substituir tudo</button>
          <button className="tool" aria-label="Fechar" onClick={() => setAchar(false)}><X size={18} strokeWidth={1.75} /></button>
        </div>
      )}

      <div className={'work' + (lateral ? '' : ' sem-lateral')}>
        <nav className="rail" aria-label="Estrutura do trabalho">
          <h2>Estrutura</h2>
          {secoes.length === 0 && <p className="vazio">Os títulos do trabalho aparecem aqui, numerados como na NBR 6024.</p>}
          <ol>
            {secoes.map((s, i) => (
              <li key={i} className={'n' + s.nivel}>
                <button onClick={() => ir(s.el)} title={NOME_FAM[s.fam]}>
                  <span className={'lombada ' + s.fam}>{s.num || (s.fam === 'pre' ? 'Pré' : s.fam === 'pos' ? 'Pós' : '–')}</span>
                  <span className="t">{s.titulo}</span>
                </button>
              </li>
            ))}
          </ol>
          <dl className="legenda" aria-label="Legenda das etiquetas">
            {Object.entries(NOME_FAM).map(([k, v]) => <div key={k}><dt className={'lombada ' + k} /><dd>{v}</dd></div>)}
          </dl>
        </nav>

        <main className="bench" ref={bench}>
          <div className="stage" style={{ zoom, '--z': zoom }}>
            <div className={'sheet-wrap' + (avisosM ? '' : ' sem-avisos')}>
              <div className={'sheet' + (guias ? '' : ' sem-guias') + (quebras ? '' : ' sem-quebras')}>
                <div className="guia" aria-hidden />
                {Array.from({ length: paginas - 1 }, (_, i) => <div key={i} className="quebra" style={{ top: TOPO + PG * (i + 1) }} aria-hidden><span>página {i + 2}</span></div>)}
                <div ref={ed} className="ed" contentEditable suppressContentEditableWarning spellCheck={ortografia} lang="pt-BR" role="textbox" aria-multiline="true" aria-label="Texto do trabalho" onInput={agendar} />
              </div>
              <div className="avisos-margem" aria-hidden>
                {chips.map((a, i) => (
                  <button key={i} className="aviso" title={a.todos} style={{ top: a.y }} onClick={() => ir(a.el)} tabIndex={-1}>{a.texto}</button>
                ))}
              </div>
            </div>
          </div>
        </main>

        <aside className="side" aria-label="Avisos e sugestões">
          <section>
            <h2>Avisos ABNT <span className={'cont' + (avisos.length ? ' ruim' : '')}>{avisos.length}</span></h2>
            {avisos.length === 0
              ? <p className="ok"><Check size={16} aria-hidden /> Nenhuma violação nas regras verificadas.</p>
              : <ul className="lista-avisos">{avisos.map((a, i) => <li key={i}><button onClick={() => ir(a.el)}>{a.longo}</button></li>)}</ul>}
            <p className="nota">Verifica fonte, tamanho, entrelinha, numeração das seções, citações (NBR 10520) e referências (NBR 6023). Margens e recuo vêm da própria folha. Páginas são estimadas: confira no PDF.</p>
          </section>
          <section>
            <h2>Sugestão da IA</h2>
            {erro && <p className="erro" role="alert">{erro}</p>}
            {!sug && !erro && <p className="vazio">Selecione um trecho, escolha o que a IA faz e clique no botão verde. Você vê a diferença e decide; Ctrl+Z desfaz.</p>}
            <p className="nota">O trecho é enviado ao Google (Gemini). Evite dados sensíveis ou trabalhos inéditos.</p>
            {sug && (
              <div className="sug">
                <p className="diff">{diff(sug.orig, sug.texto).map((p, i) => p.k === '=' ? p.t : p.k === '+' ? <ins key={i}>{p.t}</ins> : <del key={i}>{p.t}</del>)}</p>
                <div className="acoes">
                  <button className="primary" onClick={aceitar}><Check size={16} aria-hidden /> Aceitar</button>
                  <button className="ghost" onClick={() => setSug(null)}><X size={16} aria-hidden /> Rejeitar</button>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
      <footer className="status">
        <span>Página {Math.min(pag, paginas)} de {paginas}</span>
        <span>{pal} {pal === 1 ? 'palavra' : 'palavras'}</span>
        <span className="so-largo">{car} caracteres</span>
        <span className="grow" />
        <button className="status-btn" aria-label="Diminuir zoom" onClick={() => setZoomU(Math.max(.5, Math.round(zoom * 10) / 10 - .1))}><Minus size={14} /></button>
        <input type="range" min="50" max="200" step="5" value={Math.round(zoom * 100)} onChange={e => setZoomU(e.target.value / 100)} aria-label="Zoom" />
        <button className="status-btn" aria-label="Aumentar zoom" onClick={() => setZoomU(Math.min(2, Math.round(zoom * 10) / 10 + .1))}><Plus size={14} /></button>
        <button className="status-btn pct" onClick={() => setZoomU(null)} title="Ajustar à largura">{Math.round(zoom * 100)}%</button>
      </footer>
      <dialog ref={capaRef} className="capa-dlg">
        <form method="dialog" key={titulo} onSubmit={aplicarCapa}>
          <h2>Capa e folha de rosto</h2>
          <label>Instituição<input name="inst" required /></label>
          <label>Autor<input name="autor" required /></label>
          <label>Título do trabalho<input name="titulo" defaultValue={titulo} required /></label>
          <label>Natureza do trabalho <small>(opcional)</small><textarea name="natureza" rows="3" placeholder="Trabalho de conclusão de curso apresentado ao curso de … da …, como requisito parcial para …" /></label>
          <label>Orientador <small>(opcional)</small><input name="orientador" /></label>
          <div className="duas"><label>Cidade<input name="cidade" required /></label><label>Ano<input name="ano" defaultValue={new Date().getFullYear()} required /></label></div>
          <div className="acoes"><button className="primary">Inserir</button><button type="button" className="ghost" onClick={() => capaRef.current.close()}>Cancelar</button></div>
        </form>
      </dialog>
    </div>
  );
}
