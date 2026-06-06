# SYSTEM ARCHITECTURE
## Rozi Khan Dropshipping Platform

**Document Version:** 1.0
**Author:** Senior Software Architect

---

## 1. High-Level Architecture

The Rozi Khan platform employs a modern decoupled architecture. The React frontend interacts with the FastAPI backend over REST. Background operations are offloaded to Celery via Redis.

```mermaid
graph TD
    Client["Client Browser / Mobile"] -->|HTTPS| CloudFront["AWS CloudFront/CDN"]
    CloudFront --> Nginx["Nginx Reverse Proxy"]
    Nginx --> React["React Frontend"]
    Nginx --> FastAPI["FastAPI Backend"]
    FastAPI --> Postgre["PostgreSQL DB"]
    FastAPI --> Redis["Redis Cache/Broker"]
    Redis --> Celery["Celery Workers"]
    Celery --> Postgre
    FastAPI --> S3["AWS S3 / Cloudinary"]
    Celery --> ExternalAPI["External APIs (Shopify, Shiprocket)"]
```

## 2. Frontend Architecture
* **Framework:** React 19 + Vite for high-performance builds.
* **Routing:** React Router DOM v7 for declarative client-side routing.
* **State Management:** React Context API (with hooks) for global state (Auth, Cart, User Profile).
* **Styling:** Tailwind CSS v4 for utility-first responsive design.
* **Network Layer:** Axios interceptors for automatically attaching JWT tokens and handling 401 refresh flows.
* **Structure:** Separated into `Pages`, `Components`, `Services` (API calls), `Hooks`, and `Context`.

## 3. Backend Architecture
* **Framework:** FastAPI (Python) for asynchronous, high-throughput REST API generation.
* **Server:** Uvicorn (ASGI) running behind Gunicorn (WSGI) in production.
* **Validation:** Pydantic for strict schema definition, request validation, and serialization.
* **ORM:** SQLAlchemy 2.0 (Async) interacting with PostgreSQL.
* **Migrations:** Alembic for database version control.
* **Design Pattern:** Layered architecture (`Routers` -> `Services/Controllers` -> `Models/Database`).

## 4. Database Architecture
PostgreSQL is the source of truth for all structured relational data.

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ REVIEWS : writes
    SUPPLIERS ||--o{ PRODUCTS : lists
    RETAILERS ||--o{ IMPORTED_PRODUCTS : imports
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCTS ||--o{ INVENTORY : tracks
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDER_ITEMS }o--|| PRODUCTS : references
```

## 5. Redis Architecture
Redis serves multiple high-speed operational roles:
* **Message Broker:** Acts as the task queue broker for Celery.
* **Caching Layer:** Caches expensive analytical queries (e.g., Admin Dashboard stats), product catalogs, and active sessions.
* **Rate Limiting:** Backs the `slowapi` implementation to prevent API abuse.
* **Pub/Sub:** Handles real-time websocket notifications for inventory alerts.

## 6. Celery Architecture
To keep API response times low, heavy computing is handled asynchronously.

```mermaid
graph LR
    FastAPI["FastAPI App"] -->|"Publish Task"| RedisBroker["Redis Broker"]
    RedisBroker -->|"Consume Task"| Worker1["Celery Worker 1"]
    RedisBroker -->|"Consume Task"| Worker2["Celery Worker 2"]
    Worker1 -->|"Read/Write"| DB["PostgreSQL"]
    Worker2 -->|"API Call"| External["Marketplaces/Shipping APIs"]
    Worker1 -->|"Store Result"| RedisBackend["Redis Result Backend"]
```

## 7. File Storage Architecture
* **Local / Temp:** The `/uploads` directory is used during development or for processing temporary CSV imports.
* **Cloud Storage:** Images and documents are offloaded to **Cloudinary** (or AWS S3).
* **Delivery:** Assets are served via CDN to reduce server load and decrease latency.

## 8. Authentication Flow
Authentication is stateless, utilizing JSON Web Tokens (JWT).

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB
    
    User->>Frontend: Enter Credentials
    Frontend->>API: POST /api/auth/login
    API->>DB: Verify User & Password Hash
    DB-->>API: Valid
    API-->>Frontend: Return JWT Access & Refresh Tokens
    Frontend->>Frontend: Store Token in Memory/HttpOnly Cookie
    User->>Frontend: Request Protected Route
    Frontend->>API: GET /api/protected + Bearer Token
    API-->>Frontend: 200 OK (Data)
```

## 9. Authorization Flow
* **Role-Based Access Control (RBAC):** Users are assigned roles (`SUPER_ADMIN`, `SUPPLIER`, `RETAILER`, `CUSTOMER`).
* **FastAPI Dependencies:** Custom `Depends` functions inject the current user and verify their role before the router logic executes. If unauthorized, a `403 Forbidden` is thrown immediately.

## 10. Supplier Workflow
```mermaid
sequenceDiagram
    participant Supplier
    participant Platform
    participant DB
    
    Supplier->>Platform: Register & Submit KYC Docs
    Platform->>DB: Create Pending Supplier Profile
    Platform-->>Supplier: Await Admin Approval
    Supplier->>Platform: Upload Products (CSV/Manual)
    Platform->>DB: Save Products & Initial Stock
    Supplier->>Platform: Update Stock/Pricing
    Platform->>DB: Update Records
    Platform-->>Supplier: Success
```

## 11. Retailer Workflow
```mermaid
sequenceDiagram
    participant Retailer
    participant Platform
    participant Shopify_Store
    
    Retailer->>Platform: Browse Supplier Products
    Retailer->>Platform: Import Product
    Platform->>Platform: Apply Retailer Markup Margin
    Platform->>Shopify_Store: Publish via Shopify Admin API
    Shopify_Store-->>Platform: Product Live on Store
```

## 12. Order Workflow
```mermaid
sequenceDiagram
    participant Customer
    participant Retailer_Store
    participant Platform
    participant Supplier
    
    Customer->>Retailer_Store: Place Order
    Retailer_Store->>Platform: Webhook / API Order Sync
    Platform->>Platform: Validate Inventory & Wallet Funds
    Platform->>Supplier: Route Order Details
    Supplier->>Platform: Confirm Pack & Ship + Provide AWB
    Platform->>Retailer_Store: Sync Tracking Info back to Store
    Retailer_Store->>Customer: Email Tracking Info
```

## 13. Inventory Sync Workflow
When a supplier changes stock, or an order depletes stock, it must be synced globally.

```mermaid
sequenceDiagram
    participant Supplier
    participant Platform
    participant Celery_Worker
    participant Retailer_A
    participant Retailer_B
    
    Supplier->>Platform: Update Stock (-10 items)
    Platform->>Celery_Worker: Enqueue InventorySyncTask
    Celery_Worker->>Retailer_A: API Call: Update Stock on Store A
    Celery_Worker->>Retailer_B: API Call: Update Stock on Store B
```

## 14. Shipping Workflow
* **Integration:** Direct API integration with aggregators like Shiprocket.
* **Automated Logic:** When an order transitions to `PROCESSING`, a Celery task fetches shipping rates, generates a label, and acquires an AWB (Airway Bill).
* **Supplier Interface:** Suppliers can download and print the auto-generated PDF shipping label directly from their dashboard.

## 15. Marketplace Integration Workflow
```mermaid
graph TD
    Shopify["Shopify Store"] <-->|"OAuth / Webhooks"| PlatformAPI["Rozi Khan Integration API"]
    WooCommerce["WooCommerce Store"] <-->|"REST API"| PlatformAPI
    PlatformAPI --> CeleryQueue["Celery Task Queue"]
    CeleryQueue --> DB["PostgreSQL"]
```

## 16. Notification Workflow
* **Event Triggers:** Events (e.g., Order Placed, Low Stock) trigger internal signals.
* **Celery Dispatch:** The signal queues an email/SMS task.
* **Providers:** Resend API handles transactional emails. SMS is dispatched via local providers (e.g., Twilio/Fast2SMS).

## 17. AWS Deployment Architecture

```mermaid
graph TD
    Internet --> Route53["AWS Route 53"]
    Route53 --> ALB["Application Load Balancer"]
    ALB --> WebTG["Web Target Group"]
    ALB --> APITG["API Target Group"]
    WebTG --> EC2_Front["EC2: Nginx serving Static React"]
    APITG --> EC2_Back["EC2: Gunicorn + Uvicorn (FastAPI)"]
    EC2_Back --> RDS["Amazon RDS: PostgreSQL (Multi-AZ)"]
    EC2_Back --> ElastiCache["Amazon ElastiCache: Redis"]
    EC2_Back --> S3["Amazon S3: Static Uploads"]
    EC2_Celery["EC2: Celery Workers"] --> ElastiCache
    EC2_Celery --> RDS
```

## 18. Scaling Strategy
* **Horizontal Scaling (API):** Because JWT auth is stateless, FastAPI nodes can be duplicated infinitely behind the Application Load Balancer.
* **Worker Scaling (Background):** Celery workers can be added dynamically to instances as queue depth increases (monitored via CloudWatch).
* **Database Scaling:** Implement read replicas in RDS for heavy analytical queries generated by Admin dashboards.

## 19. Security Architecture
* **Encryption at Rest:** AWS RDS and S3 configured with KMS encryption.
* **Encryption in Transit:** Strict TLS/SSL via ACM on the Load Balancer.
* **Secrets Management:** Sensitive keys (Razorpay, JWT Secret, DB passwords) stored in AWS Secrets Manager or standard `.env` securely injected via CI/CD.
* **SQL Injection:** Mitigated via SQLAlchemy ORM parameterized queries.
* **XSS / CSRF:** Handled inherently by React's rendering engine and secure, HttpOnly cookie configurations where applicable.
