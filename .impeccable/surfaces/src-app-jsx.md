---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# Surface brief: editor ABNT

Mode: Operate. Visitor: estudante escrevendo TCC/artigo por horas. Task: escrever, ver violações ABNT ao vivo, formalizar trechos com IA, exportar. Constraints: folha A4 e regras ABNT atuais intactas; o texto é o centro; painéis não podem apertar a folha. Avoid: cópia do Word, app de IA genérico, formulário burocrático.

## Direction contract

THESIS: A estrutura do trabalho é uma estante classificada: a numeração progressiva (NBR 6024) vira etiquetas de lombada. Recusa a faixa cinza do Word e o painel de chat de IA.
OWN-WORLD: Verde-biblioteca profundo no cromo (trilho e barra), papel frio quase branco na bancada, três famílias de etiqueta de lombada (pré-textual âmbar, textual verde, pós-textual azul-ardósia), vermelho-correção só para violações. Folha A4 branca. Interface em sans humanista de sistema; números tabulares nas etiquetas. Filetes de 1px.
STORY: O aluno vê, sem procurar, onde está no trabalho, o que a ABNT acusa e o que a IA propõe; decide com um clique.
FIRST VIEWPORT: Barra superior verde com nome, título do documento e exportar. Faixa de ferramentas padrão abaixo. Esquerda 240px: trilho Estrutura com etiquetas de lombada por título. Centro: folha A4 com guias de margem 3/2/2/3 cm; avisos ABNT de uma linha ancorados na margem direita, na altura do trecho. Direita 300px: Avisos e Sugestão da IA (diff, aceitar/rejeitar). Ação primária: Formalizar, na faixa de ferramentas.
FORM: candidato 4 da lista fundamentada (estante classificada, CDU); raises: avisos de uma linha presos à margem do trecho (sinalização de aeroporto), filetes e guias a 1 device pixel (referência de margem larga). seed:3b41d1cc5f87b471
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
