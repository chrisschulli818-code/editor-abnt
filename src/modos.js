// Prompts da IA. Cópia de server.cjs: se mudar um, mude o outro.
export const BASE = ' Responda somente com o texto resultante, sem comentários.';
export const MODOS = {
  formalizar: 'Reescreva o texto do usuário em português formal e acadêmico, mantendo o sentido, os fatos e os parágrafos. Não adicione informações.',
  corrigir: 'Corrija ortografia, acentuação, pontuação, concordância e regência do texto do usuário, sem mudar o estilo, o sentido nem a estrutura.',
  resumir: 'Resuma o texto do usuário em português acadêmico, em um único parágrafo, mantendo as ideias principais. Não adicione informações.',
  ampliar: 'Desenvolva o texto do usuário em português formal e acadêmico, explicando melhor as ideias já presentes. Não invente fatos, dados, números nem citações.',
  terceira: 'Reescreva o texto do usuário em terceira pessoa e voz impessoal (sem "eu" nem "nós"), em português formal. Altere apenas a pessoa gramatical: preserve cada afirmação, opinião, dado e nível de certeza como estão, sem reinterpretar, generalizar nem trocar conceitos (por exemplo, "eu estava certo" deve virar "estava correto", e não "a hipótese estava correta"). Não acrescente nem remova ideias.',
};
