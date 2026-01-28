# 04. Arquitetura do Sistema (System Design Document)

## 1. Visão Geral da Arquitetura

O SisDavus adota uma arquitetura **Híbrida de Cliente Rico (Rich Client)** com capacidades **Offline-First**. O sistema não é nem puramente web (tem instalador local via Electron) nem puramente desktop (a base de código é web/React).

### Estilo Arquitetural
- **Client-Server**: Para operações online tradicionais.
- **Local-First (Edge Computing)**: O processamento de dados e validações ocorrem primariamente no dispositivo do usuário, utilizando recursos locais (CPU/Storage) para garantir performance e disponibilidade.

---

## 2. Modelo C4 (Context, Containers, Components)

### Nível 1: Diagrama de Contexto
Visão macro das integrações do sistema.

```mermaid
C4Context
    title Diagrama de Contexto do Sistema SisDavus
    Person(admin, "Administrador", "Gerencia ativos e usuários")
    Person(employee, "Colaborador", "Utiliza ativos e solicita materiais")
    
    System(sisdavus, "SisDavus Core", "Sistema de Gestão de Ativos")
    
    System_Ext(supabase, "Supabase Cloud", "Auth, Database, Storage")
    System_Ext(email, "Serviço de Email", "Notificações transacionais")

    Rel(admin, sisdavus, "Usa")
    Rel(employee, sisdavus, "Consulta")
    Rel(sisdavus, supabase, "Sincroniza dados via HTTPS")
    Rel(sisdavus, email, "Envia alertas")
```

### Nível 2: Diagrama de Containers
Detalhamento das unidades de implantação.

```mermaid
graph TB
    subgraph "Cliente (Dispositivo Usuário)"
        WebApp[Next.js PWA]
        LocalDB[(Dexie.js / IndexedDB)]
    end
    
    subgraph "Nuvem (BaaS)"
        API[Supabase REST API]
        Auth[Supabase Auth]
        RemoteDB[(PostgreSQL)]
    end

    WebApp -->|Leitura/Escrita Rápida| LocalDB
    WebApp -->|Sync em Background| API
    WebApp -->|Autenticação| Auth
    API -->|Consulta| RemoteDB
```

---

## 3. Decisões de Design (ADRs)

### ADR-001: Adoção do Modelo Offline-First
- **Contexto**: O sistema será usado em galpões e locais com Wi-Fi instável.
- **Decisão**: Utilizar `Dexie.js` como fonte primária de verdade para a UI. O servidor é tratado como um "backup remoto" e ponto de sincronização.
- **Consequências**:
    - (+) A UI é instantânea (zero latência de rede).
    - (+) Funciona totalmente sem internet.
    - (-) Complexidade aumentada para gerenciar conflitos de dados.
    - (-) Necessidade de duplicar lógica de validação (Front e Back).

### ADR-002: Estratégia Cross-Platform (Tauri 2.0)
- **Contexto**: Necessidade futura de apps nativos para Mobile (Android/iOS) e Desktop com acesso a hardware.
- **Decisão**: Migrar para **Tauri 2.0** em vez de Electron.
- **Consequências**:
    - (+) Suporte unificado a Desktop e Mobile na mesma base.
    - (+) Binários muito menores (<10MB) comparado ao Electron (~100MB).
    - (+) Maior segurança e performance (Rust backend).

### ADR-003: Backend-as-a-Service (Supabase)
- **Contexto**: Prazo curto de entrega e necessidade de Realtime.
- **Decisão**: Utilizar Supabase em vez de desenvolver backend customizado (Node/Java).
- **Consequências**:
    - (+) Velocidade de desenvolvimento (Auth e DB prontos).
    - (+) Custo inicial zero.
    - (-) Vendor Lock-in (acoplamento forte com a plataforma Supabase).

---

## 4. Teorema CAP

Na teoria de sistemas distribuídos (Brewer's Theorem), o SisDavus prioriza **Availability (A**) e **Partition Tolerance (P)** em detrimento de Consistency (C) imediata.
- O sistema é **Eventual Consistent**: Os dados podem estar temporariamente desatualizados entre dois clientes offline, mas convergirão para um estado consistente quando a conexão retornar.

---


