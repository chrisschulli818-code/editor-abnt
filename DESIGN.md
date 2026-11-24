---
name: Editor ABNT
description: Editor de TCC e artigos em que a numeração progressiva vira uma estante classificada de etiquetas de lombada.
colors:
  verde-biblioteca: "oklch(0.32 0.06 165)"
  verde-leitura: "oklch(0.42 0.09 165)"
  bancada: "oklch(0.94 0.01 160)"
  painel: "oklch(0.975 0.006 160)"
  tinta: "oklch(0.25 0.025 165)"
  tinta-suave: "oklch(0.42 0.025 165)"
  filete: "oklch(0.85 0.012 160)"
  lombada-pre: "oklch(0.84 0.14 82)"
  lombada-pos: "oklch(0.44 0.06 250)"
  correcao: "oklch(0.5 0.19 28)"
  correcao-fundo: "oklch(0.96 0.03 28)"
  folha: "#ffffff"
typography:
  ui:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    letterSpacing: "0.02em"
  lombada:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    fontFeature: "tnum"
  folha:
    fontFamily: "Times New Roman, serif"
    fontSize: "12pt"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  filete: "2px"
  controle: "4px"
  contador: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  bancada: "24px"
components:
  barra-superior:
    backgroundColor: "{colors.verde-biblioteca}"
    textColor: "oklch(0.97 0.01 160)"
    padding: "8px 16px"
  faixa-ferramentas:
    backgroundColor: "{colors.painel}"
    textColor: "{colors.tinta}"
    padding: "6px 16px"
  button-primary:
    backgroundColor: "{colors.verde-leitura}"
    textColor: "{colors.folha}"
    rounded: "{rounded.controle}"
    height: "32px"
    padding: "0 12px"
  button-primary-hover:
    backgroundColor: "{colors.verde-biblioteca}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.controle}"
    height: "32px"
    padding: "0 12px"
  lombada-pre:
    backgroundColor: "{colors.lombada-pre}"
    textColor: "oklch(0.25 0.05 80)"
    rounded: "{rounded.filete}"
    height: "22px"
  lombada-textual:
    backgroundColor: "{colors.verde-leitura}"
    textColor: "{colors.folha}"
    rounded: "{rounded.filete}"
    height: "22px"
  lombada-pos:
    backgroundColor: "{colors.lombada-pos}"
    textColor: "{colors.folha}"
    rounded: "{rounded.filete}"
    height: "22px"
  aviso-margem:
    backgroundColor: "{colors.correcao-fundo}"
    textColor: "oklch(0.4 0.17 28)"
    rounded: "{rounded.filete}"
    padding: "2px 6px"
---

# Design System: Editor ABNT

## Overview

**Creative North Star: "A Estante Classificada"**

A estrutura do trabalho e uma estante: cada titulo numerado (NBR 6024) ganha uma etiqueta de lombada no trilho esquerdo, como a classificacao decimal de uma biblioteca. O cromo e verde-biblioteca profundo, a bancada e um papel frio quase branco, a folha A4 e branca e o texto e o centro. A interface recua; so duas coisas elevam a voz: a cor da familia da lombada e o vermelho de correcao.

A densidade e de ferramenta de sessao longa: controles de 32px, texto de interface em 12 a 14px, tudo separado por filetes de 1px em vez de caixas e sombras. Sans humanista de sistema para a interface, serifada Times New Roman somente dentro da folha, porque la ela e requisito da norma e nao estilo.

**Key Characteristics:**
- Cromo verde-biblioteca (barra superior), paineis em papel frio, folha A4 branca como unico plano claro puro.
- Tres familias de lombada (amber pre-textual, verde textual, ardosia pos-textual) que codificam a posicao no trabalho.
- Vermelho de correcao reservado a violacoes ABNT e a erros.
- Filetes de 1px como unica estrutura; guias de margem 3/2/2/3 cm tambem a 1px.
- Avisos de uma linha presos a margem direita, na altura do trecho.

## Colors

Paleta restrita: um verde em duas profundidades, neutros esverdeados frios, tres cores de familia e um vermelho.

### Primary
- **Verde Biblioteca** (`colors.verde-biblioteca`): barra superior, hover do botao primario. O peso do cromo.
- **Verde Leitura** (`colors.verde-leitura`): botao primario, lombada textual, anel de foco, cursor de texto e accent-color. A cor de "agir aqui".

### Secondary
- **Ambar Pre-textual** (`colors.lombada-pre`): somente a lombada da familia pre-textual (capa, resumo, sumario).
- **Ardosia Pos-textual** (`colors.lombada-pos`): somente a lombada da familia pos-textual (referencias, apendices).

### Tertiary
- **Vermelho Correcao** (`colors.correcao`) e **Fundo de Correcao** (`colors.correcao-fundo`): avisos na margem, lista de avisos, contador com violacoes, mensagem de erro, trecho removido no diff.

### Neutral
- **Bancada** (`colors.bancada`): fundo do corpo, ao redor da folha.
- **Painel** (`colors.painel`): faixa de ferramentas, trilho e painel lateral.
- **Tinta** (`colors.tinta`) e **Tinta Suave** (`colors.tinta-suave`): texto de interface e titulos de secao/notas.
- **Filete** (`colors.filete`): toda linha divisoria de 1px.
- **Folha** (`colors.folha`): a folha A4, campos e texto sobre verde.

### Named Rules
**A Regra da Lombada.** A cor de uma etiqueta diz a que familia o titulo pertence e nada mais. Amber, verde e ardosia nao aparecem como decoracao fora das lombadas e da legenda.

**A Regra do Vermelho Unico.** Vermelho significa correcao devida. Nunca marca selecao, destaque ou marca da casa.

## Typography

**UI Font:** Segoe UI (com system-ui, -apple-system, sans-serif)
**Sheet Font:** Times New Roman (serif), exclusivo da folha e do diff

**Character:** Sans humanista de sistema, discreta, para que a folha serifada seja a unica voz tipografica. Numeros tabulares nas lombadas mantem a coluna do trilho alinhada.

### Hierarchy
- **Body / UI** (400, 14px, ~1.45): controles, campos, trilho.
- **Label** (650, 12px, 0.02em, caixa normal): titulos de secao do painel lateral ("Avisos ABNT").
- **Lombada** (700, 12px, tabular-nums): numeracao progressiva e rotulos Pre/Pos.
- **Nota** (400, 12 a 13px, 1.45): textos de apoio e estados vazios, em Tinta Suave.
- **Folha** (400, 12pt, 1.5, justificado, recuo 1.25cm): texto do trabalho; citacao longa a 10pt, entrelinha simples, recuo 4cm.

### Named Rules
**A Regra da Folha Serifada.** Serifa so dentro da folha e do diff. A interface nunca usa Times.

## Layout

Sob a barra verde ficam as abas (Inicio, Inserir, Exibir, Revisao) e uma faixa de opcoes em grupos com legenda de 11px (Historico, Fonte, Paragrafo, Estilos, Edicao...), no modelo funcional do Word mas nas cores da casa: a aba ativa se funde ao painel com um filete verde de 2px no topo, e a IA fica sempre a vista no canto direito da linha de abas. Confirmacoes e localizar/substituir abrem uma barra ambar clara sob a faixa. Na base, uma barra de status verde mostra pagina, palavras e zoom. Grade de tres colunas sob a faixa: trilho de 240px, bancada flexivel, painel de 300px. A folha A4 (21cm x 29.7cm) fica centrada na bancada com 24px de respiro e nunca e apertada pelos paineis; uma coluna de 150px a direita da folha abriga os avisos de margem. Guias de margem a 1px marcam 3cm em cima e a esquerda, 2cm embaixo e a direita. Ritmo de espacamento em 4, 8, 16 e 24px; paineis com padding 16px 12px e gap de 20px entre secoes.

Abaixo de 1000px o trilho e o painel viram faixas empilhadas sob a folha; abaixo de 700px os avisos de margem somem (permanecem na lista lateral) e a faixa de ferramentas rola na horizontal. Na impressao so a folha sai, com margens ABNT e numero da pagina no canto superior direito.

## Elevation & Depth

Plano por camadas tonais e filetes. Barra verde, paineis claros e bancada se distinguem por tom e por linha de 1px. A unica sombra e a da folha, que a levanta da bancada como papel sobre mesa.

### Shadow Vocabulary
- **Folha** (`box-shadow: 0 1px 2px oklch(0.3 0.03 160 / .2), 0 8px 24px oklch(0.3 0.03 160 / .12)`): somente a folha A4; removida na impressao.

### Named Rules
**A Regra da Unica Sombra.** Nada alem da folha projeta sombra. Hierarquia entre paineis se faz com tom e filete.

## Shapes

Cantos quase retos: 2px nas etiquetas de lombada e nos avisos (como etiquetas coladas), 4px em controles, campos, cartoes de aviso e diff, pilula de 10px apenas no contador. Bordas sempre de 1px. Um pequeno conector de 1px liga cada aviso de margem ao trecho.

## Components

### Buttons
- **Shape:** retangulo de cantos suaves (4px), altura 32px, padding horizontal 12px, icone de linha + rotulo.
- **Primary:** fundo Verde Leitura, texto branco, peso 600; hover aprofunda para Verde Biblioteca; desabilitado a 60% com cursor de progresso. Uma por contexto (Formalizar na faixa, Aceitar na sugestao).
- **Ghost:** transparente com filete; hover em verde-cinza claro. Na barra verde o filete e o hover usam branco translucido.
- **Tool:** quadrado 32px sem borda, icone de 18px; hover e active em tons de verde-cinza.
- **Focus:** anel de 2px em Verde Leitura com offset 2px (ambar claro sobre o verde da barra).

### Lombada (assinatura)
Etiqueta de 22px de altura, largura minima 34px, canto 2px, numero tabular em 700. Tres familias: ambar com texto escuro, verde e ardosia com texto branco. Titulos de nivel 2 recuam 22px no trilho. A legenda no pe do trilho repete as tres cores com seus nomes.

### Aviso de margem
Etiqueta de uma linha na coluna direita da folha, fundo Fundo de Correcao, filete e texto em vermelho, truncada com reticencias, posicionada na altura do trecho com conector de 1px. Entra com deslocamento de 4px e fade (350ms, ease-out expressivo), desativado com reduced-motion. Clique leva ao trecho.

### Painel lateral
Secoes com titulo em Label; lista de avisos como botoes de largura total em Fundo de Correcao; estado sem violacao em verde com icone de check; contador em pilula (vermelho quando ha violacoes). A sugestao da IA mostra diff em serifa (inserido verde claro, removido vermelho claro) e as acoes Aceitar/Rejeitar.

### Campos
Titulo do documento transparente na barra, filete aparece no hover; seletores da faixa em branco, 32px, filete e canto 4px.

## Do's and Don'ts

### Do:
- **Do** manter o texto no centro: folha A4 branca, margens 3/2/2/3 cm, Times 12pt, entrelinha 1,5.
- **Do** separar regioes com filete de 1px em `colors.filete` em vez de caixas ou sombras.
- **Do** usar a familia de cor da lombada somente para classificar titulos (pre, textual, pos).
- **Do** reservar o vermelho de correcao a violacoes ABNT e erros reais, em uma linha, perto do trecho.
- **Do** mostrar toda sugestao da IA como diff com aceitar e rejeitar.
- **Do** respeitar `prefers-reduced-motion`; movimento so em entrada de aviso e sugestao.

### Don't:
- **Don't** reproduzir o visual cinza do Word (so o modelo de abas e grupos, em verde-biblioteca) nem um painel de chat de IA generico.
- **Don't** usar vermelho para destaque, selecao ou marca.
- **Don't** adicionar sombras fora da folha nem raios acima de 4px (exceto o contador).
- **Don't** usar serifa na interface nem sans dentro da folha.
- **Don't** apertar a folha com paineis; os paineis se rearranjam sob ela em telas estreitas.
