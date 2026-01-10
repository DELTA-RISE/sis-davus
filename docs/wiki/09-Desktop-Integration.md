# 09. Integração Desktop (Electron Internals)

Arquitetura detalhada da camada de encapsulamento Desktop.

## 1. Modelo de Processos do Electron

O Electron opera com dois tipos de processos distintos:

- **Main Process** (`main.ts`): Processo Node.js puro. Tem acesso total ao SO. Gerencia ciclo de vida do App e Janelas.
- **Renderer Process** (BrowserWindow): Onde o Next.js roda. É um ambiente Chromium sandboxed.

```mermaid
graph TD
    Main[Main Process (Node)] -->|IPC Msg| Renderer[Renderer (Web/React)]
    Renderer -->|IPC Invoke| Main
    Main -->|Native API| OS[Sistema Operacional]
```

## 2. Segurança: Context Isolation

Para evitar que scripts maliciosos na web (Renderer) acessem o sistema de arquivos ou executem comandos shell, utilizamos **Context Isolation**.

- **Preload Script (`preload.ts`)**: Único ponto onde Node.js e DOM coexistem.
- **ContextBridge**: Expõe APIs seguras.
  
  ```typescript
  // preload.ts
  contextBridge.exposeInMainWorld('electronAPI', {
      printLabel: (zplCode) => ipcRenderer.invoke('print-label', zplCode),
      getVersion: () => ipcRenderer.invoke('get-app-version')
  });
  ```

  Dessa forma, o renderer chama `window.electronAPI.printLabel(...)`, sem nunca importar `ipcRenderer` ou `fs` diretamente.

## 3. Build Pipeline & Auto-Update

### Electron Builder
Configuração em `package.json` controla a geração dos artefatos.
- **ASAR**: O código fonte é empacotado em um arquivo `.asar` (formato de arquivo virtual read-only) para evitar que usuários modifiquem o código fonte facilmente após a instalação.

### Update Mechanism (Fase 2)
Embora não implementado no MVP, a arquitetura suporta `electron-updater`.
1.  App verifica URL de releases no GitHub/S3.
2.  Baixa o diferencial (`.blockmap`).
3.  Aplica o update em background.
4.  Reinicia para aplicar.

---

[Próximo: Testes e Qualidade →](./10-Testing-Strategy.md)
