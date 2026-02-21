# Welcome to your Lovable project

## Banco de dados: Supabase

Este projeto usa **Supabase** como backend (PostgreSQL, autenticação e armazenamento de arquivos).

### Passo a passo para deixar o sistema funcional

1. **Instalar dependências**:
   ```sh
   npm i
   ```

2. **Configurar o Supabase**:
   - Crie um projeto em [Supabase](https://supabase.com).
   - No dashboard: **Project Settings** → **API** → anote a **URL** e a chave **anon public**.
   - Rode as migrações em `supabase/migrations/` (via Supabase CLI ou pelo SQL Editor no dashboard).

3. **Variáveis de ambiente**:
   - Crie um arquivo `.env` na raiz com:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-public
   ```

4. **Subir o app**:
   ```sh
   npm run dev
   ```

5. **Primeiro uso (setup único)**:
   - Na primeira vez você verá a tela de **Configuração inicial**.
   - Crie a **conta do administrador** (nome, e-mail, senha).
   - Depois, faça login com o admin e use **Gerenciar usuários** no Dashboard para cadastrar atendentes, admins e produtores.

### O que o Supabase fornece

- **Auth**: login/cadastro com e-mail e senha (Supabase Auth).
- **Tabelas**: `profiles`, `user_roles`, `demands`, `demand_deliverables`, `app_config`.
- **Storage**: bucket `demand-files` para upload/download de entregas (arquivos de áudio).

### Comandos úteis

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Sobe o frontend (Vite). |

---

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

This project uses Supabase for database, auth and storage. Install dependencies and set `.env` as above, then run `npm run dev`.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- Supabase (PostgreSQL, Auth, Storage)
- shadcn-ui
- Tailwind CSS
