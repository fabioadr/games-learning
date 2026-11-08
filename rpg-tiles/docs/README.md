# Docs do rpg-tiles

O `README.md` do projeto explica **como o código funciona hoje**. Esta pasta controla
**para onde ele vai**: ideias, propostas, o que está em andamento e o que já entrou.

| Arquivo | Para que serve |
|---------|----------------|
| [`ROADMAP.md`](ROADMAP.md) | Painel único: em andamento, próximo, backlog e feito. Comece por aqui. |
| [`propostas/`](propostas/) | Uma proposta por arquivo, para tudo que leva mais de uma sessão. |
| [`propostas/_modelo.md`](propostas/_modelo.md) | Modelo para copiar ao criar uma proposta. |
| [`CHANGELOG.md`](CHANGELOG.md) | Histórico do que entrou no jogo, por data. |
| [`EDITOR.md`](EDITOR.md) | Manual do editor de mapa (aba do artefato): ferramentas, avisos, persistência. |
| [`ARTEFATO.md`](ARTEFATO.md) | Como o build vira Artefato Claude para jogar no celular. |

## Como uma ideia evolui

1. **Ideia**: vira uma linha no Backlog do `ROADMAP.md`, com um ID e uma frase.
2. **Proposta**: se cabe num commit, pule para o passo 4. Se não cabe, copie
   `propostas/_modelo.md` para `propostas/P-NNN-nome-curto.md` com status **Rascunho**,
   quebrando o trabalho em etapas pequenas, cada uma jogável ou usável sozinha.
3. **Aceite**: o dono lê, responde as perguntas em aberto e muda o status para **Aceita**.
   A proposta sobe para "Próximo" no roadmap.
4. **Execução**: uma etapa por vez, cada uma no seu branch. Ao terminar uma etapa:
   marque a caixa dela na proposta, registre decisões no "Diário" da proposta e adicione
   uma linha no `CHANGELOG.md`.
5. **Fim**: com todas as etapas feitas, status **Concluída** e a linha vai para "Feito" no
   roadmap. Se mudar de ideia no caminho, status **Descartada** com o motivo. Propostas
   nunca são apagadas: o histórico de decisões também é material de estudo.

## IDs

- `P-NNN`: propostas (P-001, P-002…), numeradas na ordem de criação.
- `E-NN`: exercícios de estudo do backlog. São pequenos e normalmente não precisam de
  proposta; se um crescer, ganha uma `P-NNN` e o roadmap aponta para ela.

## Status

| Status | Significado |
|--------|-------------|
| Rascunho | Escrita, esperando leitura e resposta do dono |
| Aceita | Aprovada, ainda não começou |
| Em andamento | Pelo menos uma etapa feita ou em execução |
| Concluída | Todas as etapas feitas |
| Descartada | Abandonada, com o motivo registrado |
