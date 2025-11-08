# Syarah Platform

## Project Structure

### Apps

#### 1. **bulk-messaging**
Bulk messaging application that handles sending messages via Twilio and SendGrid. Supports campaign management, message queuing with RabbitMQ, and asynchronous message processing.

**Location:** `apps/bulk-messaging/`

#### 2. **elasticsearch-index**
Elasticsearch indexing service that synchronizes database records with Elasticsearch for fast search capabilities. Handles initial sync, incremental updates, and real-time indexing via message queues.

**Location:** `apps/elasticsearch-index/`

### Packages

#### 1. **@my/common** (v1.0.23)
Shared utilities and common functionality used across all applications. Includes RabbitMQ utilities, Redis cache managers, and shared interfaces.

#### 2. **@my/messaging** (v1.0.9)
Messaging package that provides abstractions for sending messages via Twilio (SMS) and SendGrid (Email).

#### 3. **@my/sequelize** (v1.0.16)
Database package providing Sequelize ORM utilities and shared database models.

#### 4. **@my/elasticsearch** (v1.0.0)
Elasticsearch manager package for managing Elasticsearch connections, indices, and operations.

---

## Required Installations

```bash
npm i -g pnpm
npm i -g turbo
```

---

## Root Commands

These commands run from the root directory and affect all packages/apps:

| Command | Description |
|---------|-------------|
| `pnpm run clean` | Clean build artifacts in all packages |
| `pnpm run clean-all` | Clean build artifacts and node_modules in all packages |
| `pnpm run build-all` | Build all packages and apps with forced rebuild |

---

## App-Specific Commands

### bulk-messaging

Navigate to `apps/bulk-messaging/` and run:

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start the bulk messaging server |
| `npm run server` | Build and start the server |
| `npm run seed` | Build and seed campaign data |
| `npm run run:consumer` | Build and start the message consumer worker |


**Running the app:**
```bash
cd apps/bulk-messaging
npm run build
npm run start
```

---

### elasticsearch-index

Navigate to `apps/elasticsearch-index/` and run:

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start the elasticsearch indexing service |
| `npm run db:sync` | Build and synchronize database schema |
| `npm run seed:products` | Build and seed product data |
| `npm run sync:initial` | Build and perform initial Elasticsearch sync |
| `npm run worker:sync` | Build and start the sync worker (consumer) |

**Running the app:**
```bash
cd apps/elasticsearch-index
npm run build
npm run start
```

---

## Package Commands

All packages share similar build commands. Navigate to any package directory (`packages/[package-name]/`) and run:

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run build-js` | Compile TypeScript and resolve path aliases |
| `npm run clean` | Remove build artifacts |
| `npm run clean-all` | Remove build artifacts and node_modules |

**Additional commands for @my/common:**
- `npm run test` - Run tests with vitest
- `npm run test:watch` - Run tests in watch mode

---

## Development Workflow

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build all packages:**
   ```bash
   pnpm run build-all
   ```

3. **Run specific app:**
   ```bash
   # For bulk-messaging
   cd apps/bulk-messaging
   npm run server

   # For elasticsearch-index
   cd apps/elasticsearch-index
   npm run start
   ```

4. **Clean everything:**
   ```bash
   pnpm run clean-all
   ```

---

## Technologies Used

- **Build System:** Turbo, pnpm workspaces
- **Language:** TypeScript
- **Database:** MySQL (via Sequelize)
- **Search:** Elasticsearch
- **Message Queue:** RabbitMQ
- **Caching:** Redis, ioredis
- **Messaging Services:**  SendGrid (Email)
- **DI Container:** Inversify
- **Web Framework:** Express

---

## Package Manager

This project uses **pnpm** (v10.12.3) as the package manager with workspaces for managing the monorepo structure.
