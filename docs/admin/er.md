```mermaid
erDiagram
  staff }o--|| auth_users : "user_id"
  clients ||--o{ requests : tiene
  requests ||--o{ request_events : historial
  pack_catalog ||--o{ price_versions : precios
  pack_catalog ||--o{ requests : elegido
  clients ||--o{ subscriptions : contrata
  pack_catalog ||--o{ subscriptions : pack
  price_versions ||--o{ subscriptions : "precio usado"
  subscriptions ||--o{ subscription_changes : "cambios de pack"
  subscriptions ||--o{ charges : cobros
  charges ||--o{ payments : pagos
  promotions ||..o{ subscriptions : "Fundadores"
  email_outbox }o..|| clients : borrador
  audit_log }o..|| staff : actor
```
