# Products Microservice

A NestJS microservice for managing products over TCP. It uses Prisma ORM with SQLite for persistence and supports product creation, pagination, retrieval, updates, and soft deletion.

## Tech Stack

- Node.js
- NestJS
- TypeScript
- TCP transport
- Prisma ORM
- SQLite
- Class Validator
- Jest

## Prerequisites

- Node.js 20 or later
- npm

## Installation

```bash
git clone https://github.com/Nest-Microservices-h/products-ms-h.git
cd products-ms-h
npm install
```

Create a `.env` file based on `.env.template`:

```env
PORT=3001
DATABASE_URL="file:./dev.db"
```

`PORT` is the TCP port used by the microservice. `DATABASE_URL` points to the SQLite database used by Prisma.

## Database Setup

Apply the existing migrations with:

```bash
npx prisma migrate dev
```

Generate the Prisma client when required:

```bash
npx prisma generate
```

## Running the Microservice

```bash
# Development with watch mode
npm run start:dev

# Standard development run
npm run start

# Production
npm run build
npm run start:prod
```

The service starts as a TCP microservice on the port configured by `PORT`. It does not expose REST or HTTP endpoints.

## Message Patterns

The products controller handles these TCP message patterns:

| Pattern             | Description                             |
| ------------------- | --------------------------------------- |
| `create-product`    | Creates a product                       |
| `find-all-products` | Returns active products with pagination |
| `find-one-product`  | Returns an active product by ID         |
| `update-product`    | Updates an active product               |
| `remove-product`    | Soft-deletes a product                  |

Example client configuration:

```ts
ClientProxyFactory.create({
  transport: Transport.TCP,
  options: {
    port: 3001,
  },
});
```

Example request:

```ts
client.send(
  { cmd: 'create-product' },
  {
    name: 'Keyboard',
    price: 49.99,
  },
);
```

## Product Model

| Field       | Type       | Description                 |
| ----------- | ---------- | --------------------------- |
| `id`        | `number`   | Auto-incremented identifier |
| `name`      | `string`   | Unique product name         |
| `price`     | `number`   | Product price               |
| `available` | `boolean`  | Product availability status |
| `createdAt` | `DateTime` | Creation timestamp          |
| `updatedAt` | `DateTime` | Last update timestamp       |

Only available products are returned by read operations. Products are soft-deleted by setting `available` to `false` instead of removing the database record.

## Validation and Pagination

Global validation is enabled with whitelisting and rejection of non-whitelisted properties. Product and pagination payloads are validated through DTOs.

The `find-all-products` pattern accepts the following optional payload fields:

```ts
{
  page?: number;  // defaults to 1
  limit?: number; // defaults to 10
}
```

The response includes the product data and pagination metadata: `total`, `page`, and `lastPage`.

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```

## Code Quality

```bash
# Format source and test files
npm run format

# Lint and automatically fix issues
npm run lint
```

## Project Structure

```text
src/
├── common/       # Shared DTOs and utilities
├── config/       # Environment configuration and validation
├── generated/    # Generated Prisma client
├── lib/          # Shared infrastructure services
└── products/     # Product module, controller, service, DTOs, and entities

prisma/
├── migrations/   # Database migrations
└── schema.prisma # Prisma data model
```

## License

This project is private and currently does not define a public license.
