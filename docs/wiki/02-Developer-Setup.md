# 02. Começando (Getting Started)

Este guia cobre os pré-requisitos, instalação e a execução do ambiente de desenvolvimento do **SisDavus**.

## Pré-requisitos

Antes de iniciar, certifique-se de ter as seguintes ferramentas instaladas em seu ambiente:

- **Node.js** (v20 ou superior recomendada)
- **Bun** (Gerenciador de pacotes e runtime utilizado no projeto)
- **Git** (Sistema de controle de versão distribuído)

## Configuração do Ambiente

1. **Clone o Repositório**
   ```bash
   git clone https://github.com/seu-usuario/sis-davus.git
   cd sis-davus
   ```

2. **Instale as Dependências**
   Utilize o `bun` para uma instalação rápida:
   ```bash
   bun install
   ```
   > Caso não tenha o Bun instalado, você pode usar `npm install` ou `yarn`, mas os scripts do projeto estão otimizados para Bun.

3. **Variáveis de Ambiente**
   Crie um arquivo `.env.local` na raiz do projeto. Você pode basear-se em um template se houver, ou configurar as chaves do Supabase:

   ```env
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_publica
   ```

## Scripts Disponíveis

Os seguintes scripts estão definidos no `package.json` para facilitar o fluxo de trabalho:

### Desenvolvimento Web
Para iniciar o servidor de desenvolvimento do Next.js (com Turbopack):
```bash
bun run dev
```
O app estará acessível em `http://localhost:3000`.

### Desenvolvimento Desktop (Electron)
Para rodar a aplicação em modo Desktop, simulando o ambiente de produção localmente e assistindo mudanças no processo principal:
```bash
bun run dev:electron
```
Este comando usa `concurrently` para rodar o Next.js e o Electron simultaneamente.

### Build (Web)
Para compilar a aplicação para produção na web:
```bash
bun run build
```

### Build (Desktop)
Para gerar o executável/instalador para o sistema operacional atual:
```bash
bun run build:electron
```
O output será gerado na pasta `dist/`.

### Linting
Para verificar problemas de linting no código:
```bash
bun run lint
```

## Estrutura de Diretórios Inicial

Uma visão rápida das pastas principais que você encontrará:

- `/src/app`: Rotas e páginas do Next.js (App Router).
- `/src/components`: Componentes Reutilizáveis de UI.
- `/src/lib`: Utilitários, configurações de banco (Dexie/Supabase) e lógicas de negócio.
- `/electron`: Código fonte do processo principal do Electron (`main.ts`, `preload.ts`).
- `/public`: Assets estáticos (imagens, ícones).

---

[Próximo: Arquitetura do Sistema →](./03-Architecture.md)
