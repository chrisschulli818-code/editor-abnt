import { useRef, useState } from 'react';
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Baseline, Highlighter, RemoveFormatting,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent, LineHeight,
  Table, ImagePlus, Captions, BookMarked, TableOfContents, SeparatorHorizontal, LayoutTemplate, Search,
  PanelLeft, Ruler, SpellCheck, GraduationCap, ListChecks, Square, Eye, ScanLine, Replace,
} from 'lucide-react';

export const ABAS = ['Início', 'Inserir', 'Exibir', 'Revisão'];
const FONTES = ['Times New Roman', 'Arial'], FORA = ['Calibri', 'Georgia', 'Verdana', 'Courier New'];
const TAMANHOS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
const ESPACOS = [1, 1.15, 1.5, 2];
const ESTILOS = [['p', 'Texto', 'corpo'], ['h1', 'Seção 1', 'h1'], ['h2', 'Seção 1.1', 'h2'], ['blockquote', 'Citação', 'cit']];
const mais = (lista, v) => (v == null || lista.includes(v) ? lista : [...lista, v].sort((a, b) => a - b));

const Btn = ({ icon: I, label, onClick, on }) => (
  <button className="tool" title={label} aria-label={label} aria-pressed={on} onMouseDown={e => e.preventDefault()} onClick={onClick}><I size={18} strokeWidth={1.75} /></button>
);
const Big = ({ icon: I, label, onClick, on }) => (
  <button className="big" aria-pressed={on} onMouseDown={e => e.preventDefault()} onClick={onClick}><I size={22} strokeWidth={1.5} aria-hidden /><span>{label}</span></button>
);
const Grupo = ({ nome, children, grandes }) => (
  <div className="grupo" role="group" aria-label={nome}>
    <div className={'grupo-corpo' + (grandes ? ' grandes' : '')}>{children}</div>
    <span className="grupo-nome">{nome}</span>
  </div>
);
// Cor: o seletor nativo fica escondido; o botão mostra a cor atual numa tira.
function Cor({ icon: I, label, tipo, padrao, a }) {
  const r = useRef(), [c, setC] = useState(padrao);
  return (
    <span className="cor">
      <button className="tool" title={label} aria-label={label} onMouseDown={e => e.preventDefault()} onClick={() => r.current.click()}>
        <I size={18} strokeWidth={1.75} /><i style={{ background: c }} />
      </button>
      <input ref={r} type="color" value={c} tabIndex={-1} aria-hidden onChange={e => { setC(e.target.value); a.cor(tipo, e.target.value); }} />
    </span>
  );
}

export default function Faixa({ aba, setAba, fmt, a, v, modo, setModo, MODOS, busy, onIA }) {
  const seletorIA = <select aria-label="O que a IA faz" value={modo} onChange={e => setModo(e.target.value)}>{Object.entries(MODOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>;
  return (
    <>
      <div className="abas" role="tablist" aria-label="Guias">
        {ABAS.map(n => <button key={n} role="tab" id={'aba-' + n} aria-selected={aba === n} aria-controls="faixa" className="aba" onClick={() => setAba(n)}>{n}</button>)}
        <div className="ia">
          <span className="so-largo">{seletorIA}</span>
          <button className="primary" onMouseDown={e => e.preventDefault()} onClick={onIA} disabled={busy}>
            <GraduationCap size={17} aria-hidden /> {busy ? 'Aguarde…' : MODOS[modo]}
          </button>
        </div>
      </div>

      <div className="faixa" id="faixa" role="tabpanel" aria-labelledby={'aba-' + aba}>
        {aba === 'Início' && <>
          <Grupo nome="Histórico">
            <div className="linha"><Btn icon={Undo2} label="Desfazer" onClick={() => a.exec('undo')} /><Btn icon={Redo2} label="Refazer" onClick={() => a.exec('redo')} /></div>
          </Grupo>
          <Grupo nome="Fonte">
            <div className="linha">
              <select aria-label="Fonte" value={fmt.fonte} onChange={e => a.exec('fontName', e.target.value)}>
                <optgroup label="ABNT">{FONTES.map(f => <option key={f}>{f}</option>)}</optgroup>
                <optgroup label="Fora da norma (gera aviso)">{FORA.map(f => <option key={f}>{f}</option>)}</optgroup>
              </select>
              <select aria-label="Tamanho" className="curto" value={fmt.tam} onChange={e => a.tamanho(e.target.value)}>{mais(TAMANHOS, fmt.tam).map(t => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="linha">
              <Btn icon={Bold} label="Negrito" on={fmt.b} onClick={() => a.exec('bold')} />
              <Btn icon={Italic} label="Itálico" on={fmt.i} onClick={() => a.exec('italic')} />
              <Btn icon={Underline} label="Sublinhado" on={fmt.u} onClick={() => a.exec('underline')} />
              <Btn icon={Strikethrough} label="Tachado" on={fmt.s} onClick={() => a.exec('strikeThrough')} />
              <Btn icon={Subscript} label="Subscrito" on={fmt.sub} onClick={() => a.exec('subscript')} />
              <Btn icon={Superscript} label="Sobrescrito" on={fmt.sup} onClick={() => a.exec('superscript')} />
              <span className="sep" />
              <Cor icon={Baseline} label="Cor do texto" tipo="foreColor" padrao="#111111" a={a} />
              <Cor icon={Highlighter} label="Realce" tipo="hiliteColor" padrao="#fff200" a={a} />
              <Btn icon={RemoveFormatting} label="Limpar formatação" onClick={() => a.exec('removeFormat')} />
            </div>
          </Grupo>
          <Grupo nome="Parágrafo">
            <div className="linha">
              <Btn icon={List} label="Lista" on={fmt.ul} onClick={() => a.exec('insertUnorderedList')} />
              <Btn icon={ListOrdered} label="Lista numerada" on={fmt.ol} onClick={() => a.exec('insertOrderedList')} />
              <Btn icon={Outdent} label="Diminuir recuo" onClick={() => a.exec('outdent')} />
              <Btn icon={Indent} label="Aumentar recuo" onClick={() => a.exec('indent')} />
              <span className="sep" />
              <LineHeight size={16} strokeWidth={1.75} aria-hidden className="ico-mudo" />
              <select aria-label="Espaçamento entre linhas" className="curto" value={fmt.lh} onChange={e => a.linha(e.target.value)}>{mais(ESPACOS, fmt.lh).map(t => <option key={t} value={t}>{String(t).replace('.', ',')}</option>)}</select>
            </div>
            <div className="linha">
              <Btn icon={AlignLeft} label="Alinhar à esquerda" on={fmt.al === 'left'} onClick={() => a.exec('justifyLeft')} />
              <Btn icon={AlignCenter} label="Centralizar" on={fmt.al === 'center'} onClick={() => a.exec('justifyCenter')} />
              <Btn icon={AlignRight} label="Alinhar à direita" on={fmt.al === 'right'} onClick={() => a.exec('justifyRight')} />
              <Btn icon={AlignJustify} label="Justificar" on={fmt.al === 'justify'} onClick={() => a.exec('justifyFull')} />
            </div>
          </Grupo>
          <Grupo nome="Estilos">
            <div className="estilos">
              {ESTILOS.map(([tag, nome, cls]) => (
                <button key={tag} className={'estilo ' + cls} aria-pressed={fmt.bloco === tag} onMouseDown={e => e.preventDefault()} onClick={() => a.bloco(tag)}>{nome}</button>
              ))}
            </div>
          </Grupo>
          <Grupo nome="Edição" grandes><Big icon={Replace} label="Localizar e substituir" onClick={a.achar} /></Grupo>
        </>}

        {aba === 'Inserir' && <>
          <Grupo nome="Páginas" grandes>
            <Big icon={BookMarked} label="Capa e folha de rosto" onClick={() => a.inserir('capa')} />
            <Big icon={SeparatorHorizontal} label="Quebra de página" onClick={() => a.inserir('quebra')} />
            <Big icon={LayoutTemplate} label="Modelo ABNT" onClick={a.modelo} />
          </Grupo>
          <Grupo nome="Índices" grandes>
            <Big icon={TableOfContents} label="Sumário" onClick={() => a.inserir('sumario')} />
            <Big icon={ListChecks} label="Lista de ilustrações" onClick={() => a.inserir('lista-Figura')} />
            <Big icon={ListChecks} label="Lista de tabelas" onClick={() => a.inserir('lista-Tabela')} />
          </Grupo>
          <Grupo nome="Ilustrações" grandes>
            <Big icon={ImagePlus} label="Imagem" onClick={a.abrirImagem} />
            <div className="grande-select">
              <Table size={22} strokeWidth={1.5} aria-hidden />
              <select aria-label="Inserir tabela" value="" onChange={e => a.tabela(e.target.value)}>
                <option value="" disabled>Tabela…</option>
                {['2x2', '3x3', '4x3', '5x4', '6x5'].map(t => <option key={t} value={t}>{t.replace('x', ' × ')}</option>)}
              </select>
            </div>
            <Big icon={Captions} label="Legenda de figura" onClick={() => a.inserir('Figura')} />
            <Big icon={Captions} label="Legenda de tabela" onClick={() => a.inserir('Tabela')} />
          </Grupo>
        </>}

        {aba === 'Exibir' && <>
          <Grupo nome="Zoom">
            <div className="linha">
              <select aria-label="Zoom" value={v.zoomU ? Math.round(v.zoomU * 100) : 'fit'} onChange={e => v.setZoomU(e.target.value === 'fit' ? null : e.target.value / 100)}>
                <option value="fit">Ajustar à largura</option>
                {mais([50, 75, 100, 125, 150, 200], v.zoomU ? Math.round(v.zoomU * 100) : null).map(p => <option key={p} value={p}>{p}%</option>)}
              </select>
            </div>
          </Grupo>
          <Grupo nome="Na folha" grandes>
            <Big icon={Square} label="Guias de margem" on={v.guias} onClick={() => v.setGuias(!v.guias)} />
            <Big icon={ScanLine} label="Avisos na margem" on={v.avisosM} onClick={() => v.setAvisosM(!v.avisosM)} />
            <Big icon={Ruler} label="Quebras de página" on={v.quebras} onClick={() => v.setQuebras(!v.quebras)} />
          </Grupo>
          <Grupo nome="Janela" grandes>
            <Big icon={PanelLeft} label="Ocultar painéis" on={!v.lateral} onClick={() => v.setLateral(!v.lateral)} />
          </Grupo>
        </>}

        {aba === 'Revisão' && <>
          <Grupo nome="Inteligência">
            <div className="linha">{seletorIA}</div>
            <p className="dica">Selecione um trecho e use o botão verde. Você vê a diferença e decide.</p>
          </Grupo>
          <Grupo nome="Verificação" grandes>
            <Big icon={SpellCheck} label="Ortografia" on={v.ortografia} onClick={() => v.setOrtografia(!v.ortografia)} />
            <Big icon={Eye} label="Ver avisos da ABNT" onClick={a.irAvisos} />
            <Big icon={Search} label="Localizar" onClick={a.achar} />
          </Grupo>
        </>}
      </div>
    </>
  );
}
