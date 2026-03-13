# NatuBrava - Controle de Vencimentos 🌿

Sistema web para controle de vencimento de produtos da loja NatuBrava Produtos Naturais.

## Funcionalidades

- 📊 **Dashboard** — Visão geral com cards de estatísticas e itens urgentes
- 📦 **Lista de Produtos** — 850+ produtos carregados automaticamente da planilha Google Sheets
- 🔍 **Busca e Filtros** — Busca por nome/SKU, filtros por status e categoria
- 📅 **Registro de Vencimentos** — Cadastre data de vencimento, lote, quantidade
- 🔴🟡🟢 **Status Visual** — Badges coloridos: vencido, vencendo em breve, dentro do prazo
- ✅ **Ações** — Marque como vendido, descartado ou resolvido
- 📋 **Histórico** — Tabela completa de todos os registros
- ⚙️ **Configurações** — Ajuste os dias padrão de antecedência do alerta

## Stack Tecnológica

- **Frontend**: Next.js 14+ (App Router)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Fonte de Produtos**: Google Sheets (CSV público)
- **Estilização**: CSS Vanilla
- **Deploy**: Vercel

## Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# O arquivo .env.local já está configurado

# 3. Rodar o servidor de desenvolvimento
npm run dev

# 4. Abrir no navegador
# http://localhost:3000
```

## Variáveis de Ambiente

O arquivo `.env.local` contém:

```
NEXT_PUBLIC_SUPABASE_URL=https://ocsgblhsxthndyqzpugr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
NEXT_PUBLIC_SHEET_CSV_URL=url_do_csv_da_planilha
```

## Deploy na Vercel

1. Suba o código para um repositório GitHub
2. Conecte o repositório na Vercel (vercel.com)
3. Configure as variáveis de ambiente na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SHEET_CSV_URL`
4. Deploy automático a cada push

## Estrutura do Projeto

```
controle-vencimento/
├── src/
│   ├── app/
│   │   ├── layout.js          # Layout raiz
│   │   ├── page.js            # Dashboard
│   │   ├── globals.css        # Design system
│   │   ├── products/page.js   # Lista de produtos
│   │   ├── history/page.js    # Histórico
│   │   └── settings/page.js   # Configurações
│   ├── components/
│   │   ├── Dashboard.js       # Dashboard com stats
│   │   ├── ProductList.js     # Lista de produtos
│   │   ├── ExpiryModal.js     # Modal de vencimento
│   │   ├── ActionModal.js     # Modal de resolver
│   │   └── Sidebar.js         # Navegação
│   └── lib/
│       ├── sheets.js          # Integração Google Sheets
│       ├── supabase.js        # Cliente Supabase
│       └── utils.js           # Utilitários
├── supabase-schema.sql        # SQL das tabelas
├── .env.local                 # Variáveis de ambiente
└── README.md
```

## Segurança

- ✅ Projeto 100% separado do site NatuBrava (natubrava.netlify.app)
- ✅ Planilha Google Sheets: somente leitura via CSV público
- ✅ Supabase: banco dedicado com Row Level Security
- ✅ Nenhum arquivo do site existente foi alterado

## Manutenção

- **Produtos desatualizados?** Os dados são puxados em tempo real da planilha
- **Trocar para aba EDICAO?** Altere o `gid` na URL do `.env.local`
- **Alterar dias de alerta?** Use a página de Configurações no app
- **Problemas com Supabase?** Acesse o dashboard em supabase.com
