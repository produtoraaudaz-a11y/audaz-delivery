# AUDAZ — Experiência de Entrega

Base única do portal de clientes da Audaz.

## Regra do projeto

- `app.js`, `style.css` e `shell.html`: sistema compartilhado por todos os clientes.
- `clientes/*.json`: configuração de cada cliente.
- `assets/audaz/`: identidade da Audaz.
- `assets/clientes/<cliente>/`: logos e imagens específicas do cliente.
- `<cliente>/index.html`: rota pública limpa enviada ao cliente.
- `backend/`: referência do backend Apps Script.
- `docs/`: documentação operacional.

## Links públicos

Cada cliente ativo deve ter uma URL própria:

`https://produtoraaudaz-a11y.github.io/audaz-delivery/<cliente>/`

Exemplo atual:

`https://produtoraaudaz-a11y.github.io/audaz-delivery/lavareda/`

A raiz do projeto não lista clientes e funciona apenas como porta de entrada institucional.
