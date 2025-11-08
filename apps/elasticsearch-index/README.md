# Elasticsearch Index Service

A production-grade microservice for managing product data synchronization between MySQL and Elasticsearch, providing real-time search capabilities and RESTful API endpoints.

---

## Overview

- **Maintain Product Data**: Store product information in MySQL with ACID compliance
- **Fast Full-Text Search**: Lightning-fast search powered by Elasticsearch
- **Real-time Sync**: RabbitMQ-based event-driven sync between MySQL and Elasticsearch
- **RESTful API**: Complete CRUD operations with filtering, pagination, and search
- **Batch Operations**: Efficient bulk indexing for large-scale data migration

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     MYSQL TO ELASTICSEARCH SYNC ARCHITECTURE              │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                            │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌──────────────────┐         ┌──────────────────┐                       │
│   │   REST API       │         │  Sync Worker     │                       │
│   │   (Express)      │         │  (Consumer)      │                       │
│   │  Port: 3000      │         │                  │                       │
│   └────────┬─────────┘         └────────┬─────────┘                       │
│            │                            │                                 │
└────────────┼────────────────────────────┼─────────────────────────────────┘
             │                            │
             ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           DATA SOURCES & TARGETS                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌──────────────────────────────────────────────────────────────┐        │
│   │                    MySQL Database (table_x)                  │        │
│   │  ┌─────────────────────────────────────────────────────────┐ │        │
│   │  │  Products Table:                                        │ │        │
│   │  │  • Primary source of truth                              │ │        │
│   │  │  • CRUD operations via API                              │ │        │
│   │  │  • Triggers sync events on INSERT/UPDATE/DELETE         │ │        │
│   │  └─────────────────────────────────────────────────────────┘ │        │
│   └──────────────────────────────────────────────────────────────┘        │
│            │                                           │                  │
│            │ (1) Initial Bulk Sync                     │ (2) Real-time    │
│            │     (1000 records/batch)                  │     Events       │
│            ▼                                           ▼                  │
│   ┌─────────────────────┐                   ┌──────────────────────┐      │
│   │  Bulk Sync Job      │                   │     RabbitMQ         │      │
│   │  • Batch processor  │                   │  Exchange: product_  │      │
│   │  • Progress tracking│                   │          sync        │      │
│   │  • Error handling   │                   │  ────────────────    │      │
│   └──────────┬──────────┘                   │  Queue: product_     │      │
│              │                              │         sync_queue   │      │
│              │                              │                      │      │
│              │                              │  Events:             │      │
│              │                              │  • product.created   │      │
│              │                              │  • product.updated   │      │
│              │                              │  • product.deleted   │      │
│              │                              │                      │      │
│              │                              │  DLQ: failed_msgs    │      │
│              │                              └──────────┬───────────┘      │
│              │                                         │                  │
│              └──────────────────┬──────────────────────┘                  │
│                                 │                                         │
│                                 ▼                                         │
│   ┌──────────────────────────────────────────────────────────────┐        │
│   │                  Elasticsearch (products_index)              │        │
│   │  ┌────────────────────────────────────────────────────────┐  │        │
│   │  │  Index Configuration:                                  │  │        │
│   │  │  • Mappings: text, keyword, scaled_float, date         │  │        │
│   │  │  • Analyzer: lowercase + ASCII folding                 │  │        │
│   │  │  • Settings: 2 shards, 1 replica                       │  │        │
│   │  │  • Full-text search on name & description              │  │        │
│   │  └────────────────────────────────────────────────────────┘  │        │
│   └──────────────────────────────────────────────────────────────┘        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ (Metrics & Logs)
                                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                     MONITORING & OBSERVABILITY LAYER                      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                 │
│  │    Prometheus           │  │    ELK Stack / Loki     │                 │
│  │    (Metrics)            │  │    (Centralized Logs)   │                 │
│  ├─────────────────────────┤  ├─────────────────────────┤                 │
│  │ • Sync lag time         │  │ • API request logs      │                 │
│  │ • Queue depth           │  │ • Sync worker logs      │                 │
│  │ • Index rate (docs/s)   │  │ • Error stack traces    │                 │
│  │ • Failed sync count     │  │ • Audit trail           │                 │
│  │ • API response times    │  │ • Query performance     │                 │
│  │ • ES cluster health     │  │ • Data consistency logs │                 │
│  └───────────┬─────────────┘  └───────────┬─────────────┘                 │
│              │                            │                               │
│              └────────────┬───────────────┘                               │
│                           ▼                                               │
│              ┌─────────────────────────┐                                  │
│              │   Grafana Dashboard     │                                  │
│              │   • Real-time metrics   │                                  │
│              │   • Sync status panels  │                                  │
│              │   • Alert visualization │                                  │
│              └─────────────────────────┘                                  │
│                           │                                               │
│                           ▼                                               │
│              ┌─────────────────────────┐                                  │
│              │   AlertManager          │                                  │
│              │   • Slack notifications │                                  │
│              │   • Email alerts        │                                  │
│              │   • PagerDuty           │                                  │
│              └─────────────────────────┘                                  │
│                                                                           │
│  HEALTH CHECKS: /health, /metrics, /ready                                 │
│                                                                           │
└────────────────────────────────────────────────────────────────────────── ┘
```

### Data Synchronization Strategy

#### 1️⃣ **Initial Bulk Transfer** (One-time or Full Re-sync)

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Extract from MySQL (table_x)                            │
│ ─────────────────────────────────────────────────────────────   │
│ • Query: SELECT * FROM products ORDER BY id LIMIT 1000 OFFSET N │
│ • Batch size: 1000 records (configurable)                       │
│ • Cursor-based pagination for large datasets                    │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Transform                                               │
│ ─────────────────────────────────────────────────────────────   │
│ • Map MySQL columns → Elasticsearch fields                      │
│ • Apply field type conversions                                  │
│ • Generate document IDs (use MySQL primary key)                 │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Load to Elasticsearch                                   │
│ ─────────────────────────────────────────────────────────────   │
│ • Use Bulk API: _bulk endpoint                                  │
│ • Batch operations: 1000 docs per request                       │
│ • Error handling: Retry failed documents                        │
│ • Progress tracking: Log completion percentage                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2️⃣ **Real-time Synchronization** (Change Data Capture)

```
┌─────────────────────────────────────────────────────────────────┐
│ Application-Level CDC (Event-Driven)                            │
│ ─────────────────────────────────────────────────────────────   │
│                                                                 │
│ MySQL table_x          Application Layer         RabbitMQ       │
│ ─────────────          ────────────────          ────────       │
│                                                                 │
│ INSERT/UPDATE     →    Event Publisher      →    Queue          │
│ DELETE                 (ProductService)          (persistent)   │
│                                                                 │
│ ✓ INSERT: Publish "product.created" event                       │
│ ✓ UPDATE: Publish "product.updated" event                       │
│ ✓ DELETE: Publish "product.deleted" event                       │
│                                                                 │
│ Event Payload:                                                  │
│ {                                                               │
│   "event": "product.updated",                                   │
│   "id": 123,                                                    │
│   "data": { ...product fields... },                             │
│   "timestamp": "2025-01-08T12:00:00Z"                           │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Sync Worker (Consumer)                                          │
│ ─────────────────────────────────────────────────────────────   │
│                                                                 │
│ 1. Consume event from queue                                     │
│ 2. Validate event structure                                     │
│ 3. Apply to Elasticsearch:                                      │
│    • product.created  → Index document (POST)                   │
│    • product.updated  → Update document (PUT)                   │
│    • product.deleted  → Delete document (DELETE)                │
│ 4. ACK message on success                                       │
│ 5. NACK + retry on failure (max 3 attempts)                     │
│ 6. Move to DLQ after max retries                                │
└─────────────────────────────────────────────────────────────────┘
```

### Ensuring Real-time Synchronization

**Guarantees:**

1. **Reliability**
   - Message persistence in RabbitMQ (survives broker restart)
   - Dead Letter Queue (DLQ) for failed messages
   - Automatic retries with exponential backoff

2. **Consistency**
   - Transactional writes: DB commit + Queue publish
   - Idempotency: Same message processed multiple times = same result
   - Event ordering: FIFO queue per partition key

3. **Monitoring**
   - Sync lag alert: If queue depth > 1000 for > 5 minutes
   - Failed sync alert: If DLQ message count > 10
   - Data drift detection: Periodic reconciliation job

4. **Performance**
   - Async processing: API responds immediately
   - Parallel workers: Multiple consumers for high throughput
   - Batch operations: Bulk API for efficiency

---

## Prerequisites

**Required Software:**
- Node.js >= 18.x
- MySQL >= 8.0
- Elasticsearch >= 8.15.0
- RabbitMQ >= 3.12
- Redis >= 7.0 (optional)

**Quick Install (macOS):**
```bash
brew install mysql elasticsearch rabbitmq redis
brew services start mysql elasticsearch rabbitmq redis
```

**Quick Install (Docker):**
```bash
docker-compose up -d mysql elasticsearch rabbitmq redis
```

---

## Setup

### Step 1: Install Dependencies

```bash
# From repository root
pnpm install

# Or in app directory
cd apps/elasticsearch-index
npm install
```

### Step 2: Configure Environment

Create `.env` file in `apps/elasticsearch-index/`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=syarah_db

# Elasticsearch
ES_NODE=http://localhost:9200
ES_USERNAME=
ES_PASSWORD=
ES_PRODUCTS_INDEX=products_index
ES_BATCH_SIZE=1000

# RabbitMQ
RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USER=user
RABBITMQ_PASSWORD=password
RABBITMQ_SYNC_QUEUE=product_sync_queue

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Application
NODE_ENV=production
EXPRESS_APP_PORT=3000
```

---

## Database Schema

**products** table:
- `id` (PK), `name`, `description`, `sku` (unique)
- `price`, `category`, `stock_quantity`
- `status` (active/inactive/discontinued)
- `tags` (JSON array)
- `created_at`, `updated_at`

**Indexes:** `sku`, `status`, `category`, `updated_at`

---

## Elasticsearch Index

**Mappings:**
```json
{
  "id": "long",
  "name": "text",
  "description": "text",
  "sku": "keyword",
  "price": "scaled_float",
  "category": "keyword",
  "stock_quantity": "integer",
  "status": "keyword",
  "tags": "keyword",
  "created_at": "date",
  "updated_at": "date"
}
```

**Settings:** 2 shards, 1 replica, custom analyzer with lowercase + ASCII folding

---

## API Endpoints

**Base URL:** `http://localhost:3000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/product` | List products (with filtering) |
| GET | `/product/:id` | Get product by ID |
| GET | `/product/search?q=...` | Full-text search |
| POST | `/product` | Create product |
| PUT | `/product/:id` | Update product |
| DELETE | `/product/:id` | Delete product |


## Execution Steps

### Step 3: Build the Application

```bash
npm run build
```

### Step 4: Initialize Database

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE syarah_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create tables
npm run db:sync
```

### Step 5: Seed Test Data (Optional)

```bash
npm run seed:products
```
Generates 100+ sample products with realistic data.

### Step 6: Initial Elasticsearch Sync

```bash
npm run sync:initial
```
Performs bulk sync of all MySQL products to Elasticsearch.

### Step 7: Start Services

```bash
# Terminal 1: Start REST API Server
npm start

# Terminal 2: Start Sync Worker (Real-time sync)
npm run worker:sync
```

**Verify Services:**
- API: `curl http://localhost:3000/api/v1/product`
- Elasticsearch: `curl http://localhost:9200/products_index/_count`
- RabbitMQ: Visit `http://localhost:15672` (guest/guest)

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run db:sync` | Create database tables |
| `npm run seed:products` | Generate 100+ test products |
| `npm run sync:initial` | Bulk sync MySQL → Elasticsearch |
| `npm start` | Start REST API server |
| `npm run worker:sync` | Start RabbitMQ consumer |

---

## Synchronization

### Initial Sync (Bulk)
```bash
npm run sync:initial
```
- Fetches all products from MySQL in batches (1000 records)
- Bulk indexes to Elasticsearch
- Shows progress statistics

### Real-time Sync (Event-driven)
```bash
npm run worker:sync
```
- Listens to RabbitMQ `product_sync_queue`
- Processes events: `product.created`, `product.updated`, `product.deleted`
- Updates Elasticsearch index in real-time

---

## Usage Examples

### Create a Product

```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Headphones",
    "sku": "WH-001",
    "price": 299.99,
    "category": "Electronics",
    "stock_quantity": 50,
    "status": "active",
    "tags": ["audio", "wireless"]
  }'
```

### Search Products

```bash
curl "http://localhost:3000/api/v1/product/search?q=wireless"
```

### List Products with Filters

```bash
curl "http://localhost:3000/api/v1/product?status=active&category=Electronics&minPrice=100&limit=10"
```

### Get Product by ID

```bash
curl http://localhost:3000/api/v1/product/1
```

### Update Product

```bash
curl -X PUT http://localhost:3000/api/v1/product/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 249.99, "stock_quantity": 75}'
```

### Delete Product

```bash
curl -X DELETE http://localhost:3000/api/v1/product/1
```

---

## Monitoring

**Health Checks:**
- API: `http://localhost:3000/health`
- Elasticsearch: `http://localhost:9200/_cluster/health`
- RabbitMQ: `http://localhost:15672` (guest/guest)

**Key Metrics:**
- Index document count: `curl http://localhost:9200/products_index/_count`
- Sync queue depth: Check RabbitMQ management UI
- Failed sync messages: Monitor `failed_messages` exchange

---

## Technology Stack

| Component | Technology           |
|-----------|----------------------|
| **Web Framework** | Express.js           |
| **Database** | MySQL 8.x            |
| **Search Engine** | Elasticsearch 8.x    |
| **Message Queue** | RabbitMQ             |
| **Cache** | Redis                |
| **ORM** | Sequelize            |
| **DI Container** | Inversify            |
