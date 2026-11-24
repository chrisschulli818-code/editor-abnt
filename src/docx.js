// Converte a folha (DOM) em .docx real. A biblioteca é carregada só ao exportar.
// shortcut: imagens só PNG/JPG/GIF/BMP em base64 (outras são omitidas); listas viram parágrafos com marcador digitado; sem notas de rodapé.
import { baixar } from './abnt.js';

const px = v => Math.round(parseFloat(v) * 15) || 0; // 1 px = 15 twips

export async function baixarDocx(ed, nome) {
  const D = await import('docx');
  const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, Header, PageNumber, WidthType, TabStopType, LeaderType, Tab } = D;
  const AL = { center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED };
  let quebra = false; // a página nova começa no próximo parágrafo

  const estilo = el => {
    const cs = getComputedStyle(el);
    return {
      font: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size: Math.round(parseFloat(cs.fontSize) * 1.5),
      bold: +cs.fontWeight >= 600, italics: cs.fontStyle === 'italic', color: '000000',
      underline: cs.textDecorationLine.includes('underline') ? {} : undefined, allCaps: cs.textTransform === 'uppercase',
    };
  };
  const foto = img => {
    const [cab, b64] = img.src.split(',');
    const m = /^data:image\/(png|jpe?g|gif|bmp);base64$/.exec(cab || '');
    if (!m || !b64) return null;
    const w = Math.min(img.naturalWidth || 400, 600), h = w * ((img.naturalHeight || 300) / (img.naturalWidth || 400));
    return new ImageRun({ type: m[1].replace('jpeg', 'jpg'), data: Uint8Array.from(atob(b64), c => c.charCodeAt(0)), transformation: { width: w, height: h } });
  };
  const corridas = n => [...n.childNodes].flatMap(c => {
    if (c.nodeType === 3) return c.textContent ? [new TextRun({ text: c.textContent.replace(/[ \t\n\r]+/g, ' '), ...estilo(c.parentElement) })] : [];
    if (c.nodeType !== 1) return [];
    if (c.tagName === 'BR') return [new TextRun({ break: 1 })];
    if (c.tagName === 'IMG') return [foto(c)].filter(Boolean);
    return corridas(c);
  });
  const par = (el, extra = {}) => {
    const cs = getComputedStyle(el), lh = parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) || 1;
    const vazio = !el.textContent.trim() && !el.querySelector('img');
    const quebrar = quebra; quebra = false;
    return new Paragraph({
      children: vazio ? [] : corridas(el), alignment: AL[cs.textAlign],
      indent: { left: px(cs.marginLeft) + px(cs.paddingLeft), firstLine: Math.max(0, px(cs.textIndent)) },
      spacing: { line: Math.round(lh * 240), before: px(cs.marginTop), after: px(cs.marginBottom) },
      heading: el.tagName === 'H1' ? HeadingLevel.HEADING_1 : el.tagName === 'H2' ? HeadingLevel.HEADING_2 : undefined,
      pageBreakBefore: quebrar || undefined, ...extra,
    });
  };
  const tabela = t => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...t.rows].map(r => new TableRow({ children: [...r.cells].map(c => new TableCell({ children: [par(c)] })) })),
  });
  const BLOCOS = 'P,H1,H2,UL,OL,TABLE,BLOCKQUOTE,DIV';
  const blocos = n => [...n.childNodes].flatMap(c => {
    if (c.nodeType === 3) return c.textContent.trim() ? [new Paragraph({ children: [new TextRun({ text: c.textContent.trim(), ...estilo(n) })] })] : [];
    if (c.nodeType !== 1) return [];
    const t = c.tagName, cs = getComputedStyle(c);
    let out;
    if (t === 'UL' || t === 'OL') out = [...c.children].map((li, i) => new Paragraph({ children: [new TextRun({ text: t === 'UL' ? '• ' : `${i + 1}. `, ...estilo(li) }), ...corridas(li)], indent: { left: 720, hanging: 360 }, spacing: { line: 360 } }));
    else if (t === 'TABLE') out = [tabela(c)];
    else if (t === 'DIV' && [...c.children].some(k => BLOCOS.includes(k.tagName))) out = blocos(c);
    else if (c.classList.contains('sum-i')) { // sumário: título, pontilhado e página
      const [a, , b] = c.children;
      out = [par(c, { children: [new TextRun({ text: a.textContent, ...estilo(a) }), new TextRun({ children: [new Tab(), b.textContent], ...estilo(b) })], tabStops: [{ type: TabStopType.RIGHT, position: 9071, leader: LeaderType.DOT }] })];
    } else out = [par(c)];
    if (cs.breakAfter === 'page' || cs.pageBreakAfter === 'always') quebra = true;
    return out;
  });

  const doc = new Document({
    title: nome,
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1701, left: 1701, bottom: 1134, right: 1134 } } }, // A4; 3 / 3 / 2 / 2 cm
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 })] })] }) },
      children: blocos(ed),
    }],
  });
  baixar(await Packer.toBlob(doc), (nome || 'trabalho') + '.docx');
}
