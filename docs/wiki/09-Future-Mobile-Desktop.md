# 09. Estratégia Cross-Platform (Mobile & Desktop)

O futuro do SisDavus envolve a ubiquidade de acesso. Para atingir todos os dispositivos (PCs, Tablets e Smartphones) com uma única base de código performática, adotamos a estratégia de **Migração para Tauri 2.0**.

## 1. Por que Tauri 2.0?

Diferente do Electron (usado em protótipos anteriores), o Tauri oferece:

- **Mobile First**: Suporte nativo para compilar `.apk` (Android) e `.ipa` (iOS) a partir do mesmo código web.
- **Performance**: O backend em Rust é extremamente leve e seguro.
- **Tamanho**: Apps com menos de 10MB (contra ~100MB do Electron/React Native).
- **Segurança**: Isolamento rigoroso de acesso ao sistema operacional.

## 2. Arquitetura Alvo

```mermaid
graph TD
    UI[Frontend Next.js] -->|WebView| Tauri[Tauri 2.0 Core]
    
    subgraph "Native Layer (Rust)"
        Tauri -->|JNI/Swift| Mobile[Mobile APIs (Camera, NFC)]
        Tauri -->|WinAPI/Cocoa| Desktop[Desktop APIs (Filesystem, Printers)]
    end
    
    Tauri -->|HTTP Client| Supabase[Supabase Cloud]
```

## 3. Benefícios Esperados

1.  **Scanner Nativo**: Uso da câmera do celular com performance nativa para leitura de QR Codes (substituindo o `html5-qrcode` na versão web).
2.  **Impressão Térmica**: Comunicação direta com impressoras Zebra/Epson via USB/Bluetooth para etiquetas patrimoniais.
3.  **Notificações Push**: Alertas reais no sistema de notificação do OS.

---
