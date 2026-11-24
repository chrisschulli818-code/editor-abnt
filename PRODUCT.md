# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Framework, escolhido pelo usuário. React + Vite, delegado: o produto é um aplicativo de edição (não um site de conteúdo), então React cabe melhor que Astro. A IA continua atrás do servidor Node atual (`server.js`), que guarda a chave.

## Users
Estudantes universitários escrevendo TCC e artigos, que precisam entregar dentro da ABNT sem decorar as normas. Usam o editor sozinhos, durante a escrita e antes da entrega.

## Product Purpose
Editor de texto web, semelhante ao Word, com as normas ABNT (NBR 14724 e correlatas) embutidas: a folha já nasce formatada, o sistema aponta violações e uma IA reescreve trechos em linguagem formal e acadêmica. Sucesso: o aluno entrega um documento sem correções de formatação.

## Positioning
Um editor em que a ABNT é a configuração padrão, e não um modelo para lembrar de aplicar. Um editor genérico não verifica as normas e não formaliza o texto.

## Operating Context
Escrita longa, de documentos com capa, sumário, citações e referências. Saída em PDF e Word. Uso em notebook, em sessões longas.

## Capabilities and Constraints
- Editor rico: fonte, tamanho, negrito/itálico/sublinhado, alinhamento, listas, tabela, imagem, citação longa, desfazer/refazer.
- Folha A4, margens 3/2/2/3 cm, Times New Roman ou Arial 12, espaçamento 1,5, recuo 1,25 cm, citação longa em 10.
- Verificador de violações (hoje: fonte, tamanho, espaçamento).
- Formalização por IA com diff e aceitar/rejeitar, via `server.js` (chave em `ANTHROPIC_API_KEY`).
- Exportação: PDF pela impressão do navegador; `.doc` em HTML (não é `.docx` real).
- Não implementado: paginação visual, sumário automático, cabeçalho/rodapé editáveis, validação de NBR 10520 e NBR 6023.
- Não inventar regras da ABNT; sinalizar dúvida.

## Evidence on Hand
Editor funcional em `public/index.html` e `server.js`. Não há depoimentos, usuários, métricas nem logotipo: não fabricar.

## Product Principles
- A norma é o padrão; sair dela é a exceção e fica visível.
- A IA sugere, o aluno decide: sempre com diferença visível e aceitar/rejeitar.
- O documento é o centro; a interface recua.
- Só afirmar de regra ABNT o que está implementado.
