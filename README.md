# Ohana Clean - Sistema de Gestão de Produção 🧼

Sistema completo para gestão de produção, estoque, vendas e clientes para fábricas de produtos de limpeza.
**Versão Atual:** v4.1.0

---

## ☁️ Migração para Banco de Dados Online (Supabase)

Para profissionalizar sua aplicação e ter os dados salvos na nuvem (acessível de qualquer lugar sem precisar restaurar backup), siga este guia para configurar o **Supabase**.

### Passo 1: Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta.
2. Clique em **"New Project"**.
3. Defina um nome (ex: `OhanaCleanDB`) e uma senha forte.
4. Escolha a região mais próxima (ex: São Paulo).
5. Clique em **"Create New Project"**.
6. Aguarde alguns minutos até o projeto ser criado.

### Passo 2: Configurar o Banco de Dados (CRUCIAL)
**ATENÇÃO:** Para evitar erros de permissão (`ERROR: 42501`), siga exatamente estes passos:

1. No painel do Supabase, vá no menu lateral esquerdo e clique em **SQL Editor** (ícone de terminal `>_`).
2. Clique em **+ New Query**.
3. Abra o arquivo `supabase_schema.sql` que está na pasta deste projeto.
4. **Copie TODO o conteúdo** desse arquivo.
5. Cole no editor do Supabase e clique no botão **RUN** (verde).
   *   **Não tente rodar isso pelo VS Code ou terminal.** Tem que ser no site do Supabase.
   *   Isso criará todas as tabelas e liberará as permissões de acesso necessárias.

### Passo 3: Conectar o Aplicativo
1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem) > **API**.
2. Copie a **Project URL** e a **anon public key**.
3. Crie um arquivo chamado `.env` na raiz do seu projeto (onde está o `package.json`).
4. Adicione as chaves no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```

### Passo 4: Próximos Passos (Desenvolvimento)
O sistema atual está configurado para usar o armazenamento local (`localStorage`) para garantir funcionamento offline imediato.
*   Os arquivos de configuração (`src/lib/supabaseClient.ts` e `supabase_schema.sql`) já foram criados.
*   Para ativar a sincronização real, será necessário atualizar a lógica do `store` para usar o cliente do Supabase em vez do localStorage.
*   O arquivo `src/services/api.ts` já contém exemplos prontos de como fazer essa conexão no futuro.

---

## 🚀 Como Colocar no Ar (Hospedagem Grátis e Profissional)

**Atenção:** O Google Drive e OneDrive **não** funcionam mais para hospedar sites modernos como este. A melhor opção gratuita, segura (HTTPS) e profissional hoje é a **Vercel** ou **Netlify**.

### 🌐 Opção Recomendada: Vercel (Hospedagem Grátis)

Siga estes passos simples para ter seu sistema online 24h por dia:

1.  **Crie uma conta na Vercel:**
    *   Acesse [vercel.com](https://vercel.com) e crie uma conta (pode usar seu GitHub/Google).

2.  **Instale o Vercel CLI (no seu computador):**
    *   Abra o terminal (Prompt de Comando) na pasta do projeto.
    *   Digite: `npm i -g vercel`

3.  **Faça o Deploy (Colocar no Ar):**
    *   No terminal, digite: `vercel`
    *   Responda as perguntas:
        *   Set up and deploy? **Y**
        *   Which scope? (Selecione seu nome)
        *   Link to existing project? **N**
        *   Project name? **ohana-clean**
        *   In which directory? (Aperte Enter)
        *   Want to modify settings? **N**
    *   Pronto! Ele vai gerar um link (ex: `https://ohana-clean.vercel.app`).

### ☁️ Como Funciona o Backup na Nuvem (Google Drive/OneDrive)

Como este sistema não usa um "servidor de banco de dados" pago (para ser totalmente grátis), os dados ficam salvos no **seu navegador**. Se você limpar o histórico ou trocar de computador, os dados somem.

**Para garantir segurança total:**

1.  **Configure Tudo:** Cadastre seus produtos, logo, clientes, etc.
2.  **Faça o Backup Diário:**
    *   Vá em **Configurações > Backup e Restauração**.
    *   Clique em **Fazer Backup**.
    *   Salve o arquivo `.json` diretamente na sua pasta do **Google Drive** ou **OneDrive** no computador.
3.  **Restaurar em Outro Computador:**
    *   Acesse o sistema pelo link da Vercel.
    *   Vá em **Configurações > Backup e Restauração**.
    *   Clique em **Restaurar Backup** e selecione o arquivo do seu Google Drive.

---

## 💻 Funcionalidades Principais

*   **📊 Dashboard:** Visão geral do negócio.
*   **🧪 Matérias-Primas:** Cadastro completo com controle de estoque.
*   **⚗️ Fórmulas:** Criação inteligente com cálculo de custos e proporção.
*   **💰 Precificação:** Cálculo automático de preços para Varejo, Atacado e Fardo.
*   **🏭 Fábrica:** Ordens de produção integradas com estoque.
*   **📦 Estoque:** Controle total de entradas, saídas e validade.
*   **🛍️ Vendas:** Pedidos integrados, com orçamentos e status de produção.
*   **👥 Clientes e Fornecedores:** Cadastro completo.

---

## 🛠️ Instalação Local (Para Desenvolvedores)

Se você preferir rodar apenas no seu computador sem internet:

1.  Instale o [Node.js](https://nodejs.org/) (versão LTS).
2.  Abra o terminal na pasta do projeto.
3.  Instale as dependências:
    ```bash
    npm install
    ```
4.  Rode o projeto:
    ```bash
    npm run dev
    ```
5.  O sistema abrirá no navegador em `http://localhost:5173`.

---

**Desenvolvido para Ohana Clean**
