# AUDAZ — Experiência de Entrega

Repositório oficial e único dos portais de clientes da Audaz.

## Estrutura

```text
audaz-delivery/
├── index.html                 # entrada institucional; não é link de cliente
├── shell.html                 # estrutura compartilhada da interface
├── app.js                     # navegação, renderização e integrações
├── style.css                  # design system Audaz / dark + light
├── clientes/
│   ├── _template.json         # modelo para novos clientes
│   ├── lavareda.json          # cliente ativo
│   ├── pet-patty.json         # reservado
│   ├── yinyang.json           # reservado
│   ├── leonardo.json          # reservado
│   └── bebe-aba.json          # reservado
├── lavareda/
│   └── index.html             # rota pública limpa do cliente
└── assets/
    ├── audaz/                 # logos e elementos globais da Audaz
    └── clientes/
        └── lavareda/          # assets exclusivos do cliente
```

## Link oficial enviado ao cliente

Nunca enviar link do repositório, URL com `?cliente=` ou endereço de teste.

Lavareda:

`https://produtoraaudaz-a11y.github.io/audaz-delivery/lavareda/`

## Regra central

`app.js`, `style.css` e `shell.html` pertencem à experiência Audaz e são compartilhados por todos os clientes.

Cada cliente altera apenas:
- configuração em `clientes/<slug>.json`;
- assets em `assets/clientes/<slug>/`;
- rota pública mínima em `<slug>/index.html`;
- backend/projectKey quando o portal estiver ativo.

Não duplicar o sistema visual ou a lógica por cliente.

## Como ativar um novo cliente

1. Copiar `clientes/_template.json` para `clientes/<slug>.json`.
2. Preencher nome, textos, recursos, backend e projectKey.
3. Criar `assets/clientes/<slug>/` e adicionar logo/imagens oficiais.
4. Criar `<slug>/index.html` alterando somente `data-client` e o título da página.
5. Testar desktop, mobile, tema automático, claro e escuro.
6. Testar aprovação, alteração e calendário.
7. Só então enviar a URL pública ao cliente.

## Status atual

Lavareda é o primeiro cliente ativo. Os demais JSONs estão apenas reservados e não devem receber rota pública até serem configurados.
