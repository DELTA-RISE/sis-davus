# Plano de Melhorias: Expansão Desktop com Electron

Este documento detalha um roteiro de funcionalidades avançadas para transformar o **SisDavus** de uma aplicação web empacotada em um software desktop de alta performance e integrado ao sistema operacional.

## 1. Experiência do Usuário (UX) e Integração com OS

### 🔔 Notificações Nativas
Utilizar o sistema de notificações do Windows para alertas importantes, visíveis mesmo com o app minimizado.
- **Uso:** Alertas de estoque baixo, aprovações pendentes, conclusão de processos longos.
- **Implementação:** API `Notification` do Electron/HTML5 integrada ao Main Process.

### 🌓 Sincronização de Tema e Window State
- **Persistência de Janela:** Lembrar o tamanho e a posição da janela ao fechar, e se estava maximizada.
- **Tema OS:** Detectar automaticamente a preferência de tema (Claro/Escuro) do Windows e alternar a UI.

### 🖼️ Splash Screen
Criar uma janela de carregamento leve e rápida que aparece imediatamente ao abrir o executável, enquanto o Next.js carrega em segundo plano. Isso melhora a percepção de velocidade.

### 🚥 Barra de Progresso na Taskbar
Mostrar o progresso de operações longas (como importação de planilhas grandes ou geração de relatórios PDF) diretamente no ícone da barra de tarefas (verde/amarelo/vermelho).

---

## 2. Hardware e Operações (Foco em Logística)

### 🖨️ Impressão Silenciosa (Silent Printing)
**Funcionalidade crítica para gestão de patrimônio.**
Permitir a impressão de etiquetas de QR Code e relatórios diretamente para uma impressora padrão (ou específica de etiquetas) sem abrir a caixa de diálogo "Imprimir" do sistema.
- **Benefício:** Agilidade na etiquetagem em massa de ativos.

### 📟 Suporte Avançado a Leitores de Código de Barras
Embora leitores funcionem como teclado, o Electron permite interceptar eventos de hardware ou tratar a entrada de dados de, forma diferenciada para evitar que o scanner escreva em campos de texto aleatórios se o foco estiver errado.

### 🖥️ Múltiplas Janelas (Multi-Window)
Permitir que o usuário "destaque" uma aba ou abra um detalhe de item em uma nova janela independente.
- **Uso:** Comparar dois itens lado a lado ou manter o Painel de Controle aberto em um monitor enquanto gerencia estoque no outro.

---

## 3. Produtividade e "Power Users"

### ⌨️ Atalhos Globais (Global Hotkeys)
Atalhos que funcionam mesmo que o app não esteja em foco.
- **Exemplo:** `Ctrl+Shift+L` para focar na barra de busca rapidamente ou abrir a janela se estiver minimizada na bandeja.

### 📂 Arrastar e Soltar (File Drag & Drop)
Permitir arrastar arquivos (Excel, Imagens de Assets) diretamente do Windows Explorer para a janela do aplicativo para upload/importação instantânea.

### 🔗 Deep Linking (`sisdavus://`)
Permitir que links externos ou e-mails abram diretamente o aplicativo em uma tela específica.
- **Exemplo:** Um e-mail de alerta de estoque com um link `sisdavus://inventory/item/123` abre o app direto no item.

---

## 4. Distribuição e Manutenção

### 🔄 Auto-Update
Implementar `electron-updater` para que o aplicativo baixe e instale atualizações automaticamente, garantindo que todos os usuários tenham as correções e funcionalidades mais recentes sem reinstalação manual.

### 🔒 Kiosk Mode (Modo Quiosque)
Uma configuração para rodar o app em tela cheia restrita, impedindo o fechamento ou acesso ao OS. Ideal para terminais de consulta de estoque em armazéns.

---

## Resumo de Prioridade Sugerida

1.  **Fase 1 (Já Iniciada):** System Tray, Ícone, Build básico.
2.  **Fase 2 (Polimento):** Window State, Splash Screen e Notificações.
3.  **Fase 3 (Core Business):** Impressão Silenciosa de Etiquetas.
4.  **Fase 4 (Distribuição):** Auto-Update.
