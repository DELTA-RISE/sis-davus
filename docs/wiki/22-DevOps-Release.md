# 22. DevOps e Release Strategy

Procedimentos para versionamento, integração contínua (CI) e entrega (CD).

## 1. Versionamento Semântico (SemVer)

O SisDavus segue o padrão **Major.Minor.Patch** (ex: 1.2.4).

- **Major (1.x.x)**: Mudanças de arquitetura incompatíveis (Breaking Changes) ou reescritas completas de UI.
- **Minor (x.2.x)**: Novas funcionalidades backward-compatible (Ex: Novo relatório, nova tela).
- **Patch (x.x.4)**: Correções de bugs, ajustes de segurança, melhorias de performance invisíveis.

### Fluxo de Tags
Toda versão estável gerada é marcada com uma Git Tag: `v1.2.4`.
Isso dispara os pipelines de build de produção.

## 2. CI/CD Pipelines (GitHub Actions)

O arquivo `.github/workflows/main.yml` (conceitual) define a esteira de automação.

### Stage 1: Verificação (Pull Request)
- **Trigger**: Push em branch de feature ou PR aberto.
- **Jobs**:
  1. `bun install`
  2. `bun run lint` (Qualidade de Código)
  3. `bun run build` (Verifica se compila sem erros)

### Stage 2: Release (Push to Main/Tag)
- **Trigger**: Tag `v*` criada.
- **Jobs**:
  1. Build Web (`next build`) -> Deploy para Vercel (Produção).
  2. Build Desktop (`electron-builder`) ->
     - Assinatura de Código (Se certs presentes).
     - Upload de artefatos (.exe/.dmg) para GitHub Releases.

## 3. Checklist de Deploy Manual

Caso a automação falhe, o procedimento manual de release é:

1.  **Bump Version**:
    ```bash
    npm version patch -m "Upgrade to %s for release"
    ```
2.  **Gerar Build Limpo**:
    ```bash
    rm -rf dist/ .next/
    bun run build:electron
    ```
3.  **Smoke Test**: Instalar o executável gerado em uma VM limpa (Windows Sandbox) e verificar se abre.
4.  **Distribuição**: Copiar instalador para o servidor de arquivos/sharepoint da empresa.

---


