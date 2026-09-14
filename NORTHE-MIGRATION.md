# NORTHE Delivery — Migração

Este repositório é a base principal para consolidar os portais e experiências de entrega da operação.

## Direção

A migração de AUDAZ para NORTHE será gradual. O objetivo é preservar o que já funciona e evitar recriar soluções por cliente.

### Deve ficar aqui

- shell/interface compartilhada de entrega;
- configuração por cliente/projeto;
- assets específicos;
- integrações comuns;
- módulos de aprovação, calendário, galeria e download;
- experiências reutilizáveis de fotografia, vídeo e artes.

### Deve deixar de existir como sistema paralelo, depois de migrado

- `portal-lavareda-teste`;
- implementações isoladas do `Site-de-entregas` que forem absorvidas aqui;
- implementações isoladas do `Galeria-de-fotos` que forem absorvidas aqui.

## Regra

Novo cliente não significa novo repositório.

Primeiro tentar resolver com configuração, rota ou módulo dentro desta base. Um repositório separado só deve existir quando o produto tiver arquitetura e ciclo de vida realmente independentes.

## Marca

Nova direção: NORTHE / MADE FROM THE NORTH.

Os nomes técnicos atuais podem ser mantidos temporariamente enquanto a migração não estiver concluída, para evitar quebra de produção.
