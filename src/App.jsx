import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table, Image, Quote, Heading1, Heading2, FileDown, FileText, GraduationCap,
  Library, LayoutTemplate, Check, X,
} from 'lucide-react';
import { estrutura, verificar, diff, paragrafos, baixarDoc, MODELO } from './abnt.js';

const NOME_FAM = { pre: 'Pré-textual', tex: 'Textual', pos: 'Pós-textual' };
const FOLHA = 793; // 21 cm em px CSS
const GUTTER = 150; // coluna dos avisos, à direita da folha
const CHAVE = 'abnt-doc';

export default function App() {
  const ed = useRef(null), bench = useRef(null), saved = useRef(null), fileIn = useRef(null);
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
  const [confirmando, setConfirmando] = useState(false);

  const tituloRef = useRef(titulo); tituloRef.current = titulo;
  const analisar = useCallback(() => {
    if (!ed.current) return;
    setSecoes(estrutura(ed.current));
    setAvisos(verificar(ed.current));
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
  const aplicarModelo = () => { ed.current.innerHTML = MODELO; setConfirmando(false); analisar(); };
  const modelo = () => (ed.current.innerText.trim() ? setConfirmando(true) : aplicarModelo()); // evita apagar o trabalho sem perguntar
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
      const res = await fetch('/api/formalizar', { method: 'POST', body: JSON.stringify({ texto: orig }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.erro);
      setSug({ orig, texto: j.texto, range: r });
    } catch (e) { setErro(e.message || 'Não foi possível formalizar.'); }
    setBusy(false);
  }
  function aceitar() {
    if (sug.range) { sug.range.deleteContents(); sug.range.insertNode(document.createTextNode(sug.texto)); }
    else ed.current.innerHTML = paragrafos(sug.texto); // shortcut: o texto inteiro perde a formatação inline
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
          <button className="ghost" onClick={() => baixarDoc(ed.current.innerHTML, titulo)}><FileText size={16} aria-hidden /> Word</button>
          <button className="ghost" onClick={() => window.print()}><FileDown size={16} aria-hidden /> PDF</button>
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
        {confirmando ? (
          <span className="confirma" role="alertdialog" aria-label="Confirmar modelo" onKeyDown={e => e.key === 'Escape' && setConfirmando(false)}>
            Substituir o texto atual?
            <button className="primary" autoFocus onClick={aplicarModelo}>Substituir</button>
            <button className="ghost" onClick={() => setConfirmando(false)}>Cancelar</button>
          </span>
        ) : <button className="ghost" onMouseDown={e => e.preventDefault()} onClick={modelo}><LayoutTemplate size={16} aria-hidden /> Modelo ABNT</button>}
        <span className="grow" />
        <button className="primary" onMouseDown={e => e.preventDefault()} onClick={formalizar} disabled={busy}>
          <GraduationCap size={17} aria-hidden /> {busy ? 'Formalizando…' : 'Formalizar'}
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
            <p className="nota">Verifica fonte, tamanho, entrelinha e numeração das seções. Margens e recuo vêm da própria folha.</p>
          </section>
          <section>
            <h2>Sugestão da IA</h2>
            {erro && <p className="erro" role="alert">{erro}</p>}
            {!sug && !erro && <p className="vazio">Selecione um trecho e use Formalizar. Você vê a diferença e decide.</p>}
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
    </div>
  );
}
