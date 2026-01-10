# 05. Engenharia de Dados

Detalhes da estrutura de dados, persistência e protocolos de comunicação.

## 1. Modelo Entidade-Relacionamento (Concetual)

```mermaid
erDiagram
    Assets ||--o{ MaintenanceTasks : "possui"
    Assets ||--o{ AssetTimelines : "historico"
    Assets ||--o{ Checkouts : "alocado via"
    Products ||--o{ StockMovements : "movimenta"
    Products ||--o{ Checkouts : "consumido via"
    Users ||--o{ Checkouts : "responsavel"
    Users ||--o{ AuditLogs : "executa"
    Users ||--o{ StockMovements : "registra"
    Users ||--o{ AssetTimelines : "registra"
    
    Assets {
        string id PK "UUID"
        string name "Required"
        string code UK "Unique"
        string location FK "StorageLocations"
        string condition "Enum"
        string status "Enum"
        string category "Nullable"
        string model "Nullable"
        string serial_number "Nullable"
        string assigned_to FK "Users"
        string cost_center FK "CostCenters"
        date created_at "Auto"
        date updated_at "Auto"
    }
    Products {
        string id PK "UUID"
        string name "Required"
        string sku UK "Unique"
        string category "Required"
        int quantity ">=0"
        int min_stock ">=0"
        int max_stock "Nullable"
        float unit_price ">=0.00"
        string location FK "StorageLocations"
        string supplier "Nullable"
        string cost_center FK "CostCenters"
    }
    StockMovements {
        string id PK "UUID"
        string type "In/Out"
        int quantity ">0"
        string product_id FK "Products"
        string user_id FK "Users"
        string reason "Required"
        string cost_center FK "CostCenters"
        date date "ISO8601"
    }
    MaintenanceTasks {
        string id PK "UUID"
        string title "Required"
        string description "Required"
        string asset_id FK "Assets"
        date due_date "Future"
        string status "Enum"
        string priority "Enum"
        string assigned_to FK "Users"
        float cost "Nullable"
        date completed_date "Nullable"
    }
    Checkouts {
        string id PK "UUID"
        string item_id FK "Polymorphic"
        string item_type "Asset/Prod"
        string user_id FK "Users"
        string status "Enum"
        date checkout_date "ISO8601"
        date expected_return_date "Nullable"
        date return_date "Nullable"
        string notes "Nullable"
    }
    AssetTimelines {
        string id PK "UUID"
        string asset_id FK "Assets"
        string type "Enum"
        string title "Required"
        string description "Required"
        date date "ISO8601"
    }
    AuditLogs {
        string id PK "UUID"
        string user_id FK "Users"
        string action "Required"
        string resource "Required"
        string resource_id "Nullable"
        json details "JSONB"
        string ip_address "Nullable"
    }
    Users {
        string id PK "UUID"
        string name "Required"
        string email UK "Unique"
        string role "Enum"
        string status "Enum"
        string department "Nullable"
        string phone "Nullable"
        date last_login "Nullable"
    }
    CostCenters {
        string id PK "UUID"
        string name "Required"
        string code UK "Unique"
        string responsible FK "Users"
        string status "Enum"
    }
    StorageLocations {
        string id PK "UUID"
        string name "Required"
        string type "Required"
        int capacity "Nullable"
    }
```

## 2. Dicionário de Dados

Especificação técnica dos atributos para implementação em SQL e TypeScript.

### Tabela: `assets` (Ativos)

| Coluna | Tipo TS | Obrigatório | Descrição | Valores/Regras |
| :--- | :--- | :--- | :--- | :--- |
| `id` | string | Sim | Identificador único (UUID) | UUID v4 |
| `name` | string | Sim | Nome do ativo | Min 3 chars |
| `code` | string | Sim | Código patrimonial | Único |
| `location` | string | Sim | Localização física | Texto Livre |
| `condition` | string | Sim | Condição física | Enum: 'Novo', 'Bom'... |
| `status` | string | Sim | Status de disponibilidade | Enum: 'Disponível'... |
| `category` | string | Não | Categoria do ativo | Texto Livre |
| `model` | string | Não | Modelo | Texto Livre |
| `serial_number`| string | Não | Número de série | Texto Livre |
| `cost_center` | string | Não | Centro de custo | Texto Livre |
| `updated_at` | string | Não | Data de atualização | ISO 8601 (Auto) |

### Tabela: `products` (Produtos)

| Coluna | Tipo TS | Obrigatório | Descrição | Valores/Regras |
| :--- | :--- | :--- | :--- | :--- |
| `id` | string | Sim | Identificador único (UUID) | UUID v4 |
| `name` | string | Sim | Nome do produto | Min 3 chars |
| `sku` | string | Sim | Unidade de Manutenção de Estoque | Único |
| `category` | string | Sim | Categoria | Texto Livre |
| `quantity` | number | Sim | Quantidade atual | >= 0 |
| `min_stock` | number | Sim | Estoque mínimo | >= 0 |
| `unit_price` | number | Não | Preço unitário | >= 0.00 |

### Tabela: `stock_movements` (Movimentações)

| Coluna | Tipo TS | Obrigatório | Descrição | Valores/Regras |
| :--- | :--- | :--- | :--- | :--- |
| `id` | string | Sim | Chave Primária | UUID v4 |
| `type` | string | Sim | Tipo de movimento | 'entrada' / 'saida' |
| `quantity` | number | Sim | Quantidade | > 0 |
| `product_id` | string | Sim | ID do Produto | FK -> products.id |
| `user_id` | string | Sim | ID do Usuário | FK -> users.id |
| `reason` | string | Sim | Motivo da movimentação | Texto Livre |
| `date` | string | Sim | Data da movimentação | ISO 8601 (Auto) |

### Tabela: `maintenance_tasks` (Manutenção)

| Coluna | Tipo TS | Obrigatório | Descrição | Valores/Regras |
| :--- | :--- | :--- | :--- | :--- |
| `id` | string | Sim | Chave Primária | UUID v4 |
| `asset_id` | string | Sim | Ativo relacionado | FK -> assets.id |
| `title` | string | Sim | Título da tarefa | Min 5 chars |
| `due_date` | string | Sim | Data de vencimento | >= Hoje |
| `priority` | string | Sim | Prioridade | Enum: 'Baixa', 'Média', 'Alta' |
| `status` | string | Sim | Estado da tarefa | Enum: 'Pendente'... |

### Tabela: `checkouts` (Empréstimos)

| Coluna | Tipo TS | Obrigatório | Descrição | Valores/Regras |
| :--- | :--- | :--- | :--- | :--- |
| `id` | string | Sim | Chave Primária | UUID v4 |
| `item_id` | string | Sim | ID do Item (Ativo/Produto) | FK (Polimórfica) |
| `item_type` | string | Sim | Tipo do Item | 'asset' / 'product' |
| `user_id` | string | Sim | Responsável | FK -> users.id |
| `status` | string | Sim | Status do empréstimo | Enum: 'Ativo'... |
| `checkout_date`| string | Sim | Data de retirada | ISO 8601 (Auto) |

### Tabela: `users` (Usuários)

| Coluna | Tipo TS | Obrigatório | Descrição | Valores/Regras |
| :--- | :--- | :--- | :--- | :--- |
| `id` | string | Sim | Chave Primária | UUID v4 |
| `name` | string | Sim | Nome completo | Min 3 chars |
| `email` | string | Sim | E-mail | Formato de E-mail |
| `role` | string | Sim | Permissão / Papel | Enum: 'admin'... |
| `status` | string | Sim | Estado da conta | 'active' / 'inactive' |

### Outras Tabelas
- **audit_logs**: Histórico de ações de sistema (quem, o quê, quando).
- **cost_centers**: Centros de custo para agrupamento financeiro.
- **storage_locations**: Locais físicos de armazenamento.
- **asset_timelines**: Linha do tempo de eventos de um ativo.

## 3. Local Storage Schema (Dexie.js)

O banco `SisDavusDB` no IndexedDB espelha a estrutura relacional, mas é NoSQL (key-value store).
- **Versão**: 1
- **Índices**: `++id, name, code, sku...`
- **Diferença**: No Dexie, chaves estrangeiras são apenas strings indexadas, não há integridade referencial forte (Cascading Deletes) automática como no Postgres. A aplicação deve gerenciar a integridade via código.

## 4. Protocolo de Sincronização

Diagrama de sequência do processo de Sync (`offline-sync.ts`).

```mermaid
sequenceDiagram
    participant User
    participant UI as Interface
    participant LocalDB as Dexie (Local)
    participant SyncSvc as Sync Service
    participant Cloud as Supabase
    
    User->>UI: Cria novo Ativo (Offline)
    UI->>LocalDB: Put(Asset)
    LocalDB-->>UI: Success (Temp ID)
    UI->>SyncSvc: AddToQueue(Action='upsert')
    
    Note over SyncSvc: Aguarda conexão...
    
    SyncSvc->>SyncSvc: Detect "Online" event
    SyncSvc->>LocalDB: Get Pending Items
    
    loop Para cada item
        SyncSvc->>Cloud: POST /assets (Payload)
        alt Sucesso
            Cloud-->>SyncSvc: 200 OK (Real ID)
            SyncSvc->>LocalDB: Update Asset (Real ID)
            SyncSvc->>LocalDB: Remove from Queue
        else Erro 4xx/5xx
            Cloud-->>SyncSvc: Error
            SyncSvc->>LocalDB: Mark 'Failed'
        end
    end
    
    SyncSvc-->>UI: Toast "Sincronizado!"
```

---

[Próximo: Design de Interface →](./06-Interface-Design.md)
