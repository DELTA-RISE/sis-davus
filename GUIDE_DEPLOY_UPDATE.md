# Guia de Deploy e Auto-Update do SisDavus Desktop

Este guia explica como gerar uma versão de produção do aplicativo, publicá-la no GitHub e habilitar a atualização automática para os usuários.

## 1. Pré-requisitos

Para que o Auto-Update funcione, os arquivos de instalação devem estar hospedados nas **Releases** do repositório GitHub configurado (`DELTA-RISE/sis-davus`).

Você precisará de um **Personal Access Token (PAT)** do GitHub para que a ferramenta de build consiga publicar (ou você pode fazer o upload manual se preferir).

## 2. Configurando a Versão

Sempre que for lançar uma atualização, você **DEVE** incrementar a versão no arquivo `package.json`.

```json
{
  "name": "nextjs-new",
  "version": "0.1.1",  <-- Mude aqui (ex: de 0.1.0 para 0.1.1)
  ...
}
```

## 3. Gerando o Instalador (Build)

Abra o terminal na pasta do projeto e execute:

```bash
npm run build:electron
# ou
bun run build:electron
```

Isso criará uma pasta `release/` contendo:
- `SisDavus Setup X.X.X.exe` (O instalador)
- `latest.yml` (Arquivo de controle de versão - **IMPORTANTE**)
- `win-unpacked/` (Versão descompactada para teste local)

## 4. Publicando no GitHub (Releases)

### Opção A: Manual (Recomendado para começar)
1. Vá até o repositório no GitHub: `https://github.com/DELTA-RISE/sis-davus`
2. Clique em **Releases** > **Draft a new release**.
3. Em "Tag version", crie uma tag igual à versão do package.json (ex: `v0.1.1`).
4. Título da Release: `Versão 0.1.1`.
5. Descrição: Liste as mudanças.
6. **Upload de Binários**: Arraste os arquivos da pasta `release/` para a release:
   - `SisDavus Setup 0.1.1.exe`
   - `latest.yml` (Fundamental para o auto-update funcionar)
7. Clique em **Publish release**.

### O que acontece agora?
Qualquer usuário que tentar abrir o SisDavus Desktop (versão instalada anterior):
1. O app verificará o GitHub silenciosamente ao iniciar.
2. Se houver uma `latest.yml` com versão superior, ele baixará o `.exe` em segundo plano.
3. Quando o download terminar, o usuário receberá uma notificação do Windows.
4. Ao fechar e abrir o app novamente, a nova versão será instalada automaticamente.

## Solução de Problemas

- **Erro de Certificado**: O Windows pode exibir "SmartScreen impediu..." porque o app não tem um certificado pago (Code Signing). Isso é normal para apps internos. O usuário deve clicar em "Mais informações" -> "Executar assim mesmo".
- **Não atualiza**: Verifique se o arquivo `latest.yml` foi anexado corretamente à Release no GitHub.

---

**Nota:** As funcionalidades de *Hardware* (Impressão, Tray) e *Produtividade* (Atalhos) já estão no código e funcionarão na versão construída.
