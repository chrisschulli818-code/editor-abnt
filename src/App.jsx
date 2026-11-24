import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table, Image, Quote, Heading1, Heading2, FileDown, FileText, GraduationCap,
  Library, LayoutTemplate, Check, X, Save, FolderOpen,
} from 'lucide-react';
import { estrutura, verificar, diff, paragrafos, baixar, limpar, htmlSumario, htmlLista, htmlLegenda, htmlCapa, TOPO, PG, MODELO } from './abnt.js';
import { baixarDocx } from './docx.js';

const NOME_FAM = { pre: 'Pré-textual', tex: 'Textual', pos: 'Pós-textual' };
const FOLHA = 793; // 21 cm em px CSS
const GUTTER = 150; // coluna dos avisos, à direita da folha
const CHAVE = 'abnt-doc';
const MODOS = { formalizar: 'Formalizar', corrigir: 'Corrigir', resumir: 'Resumir', ampliar: 'Ampliar', terceira: '3ª pessoa' };

export default function App() {
  const ed = useRef(null), bench = useRef(null), saved = useRef(null), fileIn = useRef(null), abrirIn = useRef(null), capaRef = useRef(null);
  const salvo = useRef((() => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } })());
  const [titulo, setTitulo] = useState(salvo.current.titulo || 'Meu trabalho');
  const deb = useRef();
  const [secoes, setSecoes] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [sug, setSug] = useState(null); // { orig, texto, range }
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const [semSalvar, setSemSalvar] = useState(false);
  const [pergunta, setPergunta] = useState(null); // { msg, acao }: confirmação inline na barra
  const [modo, setModo] = useState('formalizar');
  const [paginas, setPaginas] = useState(1);

  const tituloRef = useRef(titulo); tituloRef.current = titulo;
  const analisar = useCallback(() => {
    if (!ed.current) return;
    setSecoes(estrutura(ed.current));
    setAvisos(verificar(ed.current));
    setPaginas(Math.max(1, Math.ceil((ed.current.offsetHeight - TOPO - 75.6 - 2) / PG)));
    try { localStorage.setItem(CHAVE, JSON.stringify({ html: ed.current.innerHTML, titulo: tituloRef.current })); setSemSalvar(false); } catch { setSemSalvar(true); } // cota cheia (fotos grandes): avisa em vez de falhar calado
  }, []);
  const agendar = () => { clearTimeout(deb.current); deb.current = setTimeout(analisar, 200); }; // digitação: evita recalcular a cada tecla

  useEffect(() => {
    ed.current.innerHTML = salvo.current.html || MODELO;
    document.execCommand('styleWithCSS', false, true);
    analisar();
  }, [analisar]);

  // Seleção guardada: clicar em botões ou selects a perderia.
  useEffect(() => {
    const f = () => {
      const s = getSelection();
      if (s.rangeCount && ed.current?.contains(s.anchorNode)) saved.current = s.getRangeAt(0).cloneRange();
    };
    document.addEventListener('selectionchange', f);
    return () => document.removeEventListener('selectionchange', f);
  }, []);

  // Ajusta a folha à largura disponível, reservando a coluna dos avisos.
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setZoom(Math.min(1, (e.contentRect.width - 48) / (FOLHA + (e.contentRect.width < 700 ? 0 : GUTTER)))));
    ro.observe(bench.current);
    return () => ro.disconnect();
  }, []);

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

  const Btn = ({ icon: I, label, onClick, on }) => (
    <button className="tool" title={label} aria-label={label} onMouseDown={e => e.preventDefault()} onClick={onClick} {...(on || {})}><I size={18} strokeWidth={1.75} /></button>
  );

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

      <div className="tools" role="toolbar" aria-label="Formatação">
        <Btn icon={Undo2} label="Desfazer" onClick={() => exec('undo')} />
        <Btn icon={Redo2} label="Refazer" onClick={() => exec('redo')} />
        <span className="sep" />
        <select aria-label="Fonte" onChange={e => exec('fontName', e.target.value)} defaultValue="Times New Roman">
          <option>Times New Roman</option><option>Arial</option>
        </select>
        <select aria-label="Tamanho" onChange={e => tamanho(e.target.value)} defaultValue="12">
          <option>10</option><option>12</option><option>14</option><option>16</option>
        </select>
        <span className="sep" />
        <Btn icon={Bold} label="Negrito" onClick={() => exec('bold')} />
        <Btn icon={Italic} label="Itálico" onClick={() => exec('italic')} />
        <Btn icon={Underline} label="Sublinhado" onClick={() => exec('underline')} />
        <span className="sep" />
        <Btn icon={AlignLeft} label="Alinhar à esquerda" onClick={() => exec('justifyLeft')} />
        <Btn icon={AlignCenter} label="Centralizar" onClick={() => exec('justifyCenter')} />
        <Btn icon={AlignRight} label="Alinhar à direita" onClick={() => exec('justifyRight')} />
        <Btn icon={AlignJustify} label="Justificar" onClick={() => exec('justifyFull')} />
        <span className="sep" />
        <Btn icon={List} label="Lista" onClick={() => exec('insertUnorderedList')} />
        <Btn icon={ListOrdered} label="Lista numerada" onClick={() => exec('insertOrderedList')} />
        <Btn icon={Table} label="Inserir tabela" onClick={() => exec('insertHTML', '<table>' + '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'.repeat(3) + '</table><p></p>')} />
        <Btn icon={Image} label="Inserir imagem" onClick={() => fileIn.current.click()} />
        <input ref={fileIn} type="file" accept="image/*" hidden onChange={imagem} />
        <span className="sep" />
        <Btn icon={Heading1} label="Seção primária" onClick={() => exec('formatBlock', 'h1')} />
        <Btn icon={Heading2} label="Seção secundária" onClick={() => exec('formatBlock', 'h2')} />
        <Btn icon={Quote} label="Citação longa (recuo 4 cm, fonte 10)" onClick={() => exec('formatBlock', 'blockquote')} />
        <select aria-label="Inserir" value="" onChange={e => inserir(e.target.value)}>
          <option value="" disabled>Inserir…</option>
          <option value="capa">Capa e folha de rosto</option>
          <option value="sumario">Sumário</option>
          <option value="Figura">Legenda de figura</option>
          <option value="Tabela">Legenda de tabela</option>
          <option value="lista-Figura">Lista de ilustrações</option>
          <option value="lista-Tabela">Lista de tabelas</option>
        </select>
        {pergunta ? (
          <span className="confirma" role="alertdialog" aria-label="Confirmar" onKeyDown={e => e.key === 'Escape' && setPergunta(null)}>
            {pergunta.msg}
            <button className="primary" autoFocus onClick={pergunta.acao}>Substituir</button>
            <button className="ghost" onClick={() => setPergunta(null)}>Cancelar</button>
          </span>
        ) : <button className="ghost" onMouseDown={e => e.preventDefault()} onClick={modelo}><LayoutTemplate size={16} aria-hidden /> Modelo ABNT</button>}
        <span className="grow" />
        <select aria-label="O que a IA faz" value={modo} onChange={e => setModo(e.target.value)}>
          {Object.entries(MODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="primary" onMouseDown={e => e.preventDefault()} onClick={formalizar} disabled={busy}>
          <GraduationCap size={17} aria-hidden /> {busy ? 'Aguarde…' : MODOS[modo]}
        </button>
      </div>

      <div className="work">
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
            <div className="sheet-wrap">
              <div className="sheet">
                <div className="guia" aria-hidden />
                {Array.from({ length: paginas - 1 }, (_, i) => <div key={i} className="quebra" style={{ top: TOPO + PG * (i + 1) }} aria-hidden><span>página {i + 2}</span></div>)}
                <div ref={ed} className="ed" contentEditable suppressContentEditableWarning spellCheck lang="pt-BR" role="textbox" aria-multiline="true" aria-label="Texto do trabalho" onInput={agendar} />
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
