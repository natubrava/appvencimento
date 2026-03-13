# Design Spec: Alertas de Cores e Relatório Diário

## 1. Lógica de Cores e Status

O sistema de alertas atual será expandido para ter **4 estágios**, configuráveis pelo usuário:

* **Estágio 1 - Dentro do Prazo (Verde):** Validade longa, maior que o limite de alerta amarelo.
* **Estágio 2 - Atenção (Amarelo):** Produtos se aproximando do vencimento (ex: abaixo de 90 dias, configurável no painel). Cor: `--yellow-500` / `bg-yellow-50`
* **Estágio 3 - Urgente (Vermelho):** Produtos muito próximos do fim, demandando venda rápida (ex: abaixo de 60 dias, configurável no painel). Cor: `--red-500` / `bg-red-50`
* **Estágio 4 - Vencido (Vinho/Bordô Escuro):** Produtos com `0` dias ou negativos, marcando que já venceram/estão vencendo hoje. Cor: `--red-900` (ex: `#7f1d1d`) / `bg-red-900/10` (ex: `#fef2f2`). A cor principal da borda será algo puxado pro vinho.

**Bug Fix de Fuso Horário:**
Corrigir o cálculo em `daysUntilExpiry` e `getExpiryStatus` para respeitar o timezone local sem considerar a hora zero de uma forma confusa (offset UTC) que está causando itens faltando 2 dias caírem como verdes ou perdendo o dia.

**Configuração:**
Adicionar campos no banco de dados e na página `/settings` para ajustar os limites:
- `alert_yellow_days` (Padrão: 90)
- `alert_red_days` (Padrão: 60)

## 2. Relatório Diário Contínuo (Notificações)

A lógica do Supabase Edge Function para envio de e-mail será alterada de envios diários individuais (para quem bate a meta de "X" dias) para um **Relatório Geral Diário**.

* **Critério de Inclusão no Relatório:** O e-mail enviará **todos** os registros `(status = 'active')` que se enquadrem nos estágios Amarelo, Vermelho e Vinho.
* **Benefício:** Garantimos que os produtos que vencem a curto prazo e já estão em alerta continuem na caixa de entrada até o usuário ir ao sistema e "Resolver".
* **Conteúdo do Email:** Uma tabela/lista agrupada por Urgência (Vencidos primeiro, Vermelhos depois, Amarelos no final) informando quantos dias faltam para a expiração de cada item.

## 3. Revisão e Deploy

* Todos os componentes que testam o `status` antigo (`ok`, `expiring`, `expired`) deverão ser mapeados para a nova regra (`ok`, `warning`, `urgent`, `expired`).
* Garantir que as cores novas sejam adicionadas no `globals.css`.
* Ao fim do processo, testar tudo funcionalmente e rodar o push para o GitHub usando o CLI do `git`.
