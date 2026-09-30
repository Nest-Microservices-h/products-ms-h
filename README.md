# Products Microservice

NestJS microservice that manages products over TCP. It uses Prisma ORM 7 with SQLite and supports creation, paginated reads, updates, product validation, and soft deletion. It does not expose an HTTP API.

## Requirements

- Node.js 20 or later
- npm

## Setup

```bash
git clone https://github.com/Nest-Microservices-h/products-ms-h.git
cd products-ms-h
npm install
```

Create the local environment file from the supplied template:

```bash
cp .env.template .env
```

On PowerShell, use `Copy-Item .env.template .env` instead. The template contains:

```env
PORT=3001
DATABASE_URL="file:./dev.db"
```

`PORT` is required and selects the TCP port. `DATABASE_URL` is required by Prisma CLI and the SQLite driver; change it to use a different database file.

## Database

Apply the checked-in migrations to the configured database and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

Run `npx prisma generate` again after changing `prisma/schema.prisma`. In deployed environments, apply committed migrations with `npx prisma migrate deploy` instead of `migrate dev`.

## Run

```bash
# Development with file watching
npm run start:dev

# Build and run the production output
npm run build
npm run start:prod
```

The service listens on the configured TCP port (3001 by default). Run a TCP client separately to send requests.

## TCP API

Each request uses a Nest message pattern with a `{ cmd: string }` key. The following examples use `ClientProxy` from `@nestjs/microservices`:

```ts
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: { port: 3001 },
});

const product = await firstValueFrom(
  client.send({ cmd: 'create-product' }, { name: 'Keyboard', price: 49.99 }),
);

await client.close();
```

| Pattern             | Payload                                         | Behavior                                                                                                             |
| ------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `create-product`    | `{ name: string, price: number }`               | Creates an available product. Names must be unique; price must be non-negative and have at most four decimal places. |
| `find-all-products` | `{ page?: number, limit?: number }`             | Returns available products; both values must be positive. Defaults are `page: 1` and `limit: 10`.                    |
| `find-one-product`  | `{ id: number }`                                | Returns one available product.                                                                                       |
| `update-product`    | `{ id: number, name?: string, price?: number }` | Updates the supplied fields of an available product.                                                                 |
| `remove-product`    | `{ id: number }`                                | Marks the product unavailable; it does not delete the row.                                                           |
| `validate-products` | `number[]`                                      | Returns products matching all supplied IDs, or raises an RPC error if any ID is missing.                             |

The `find-all-products` response has this shape:

```ts
{
  data: Product[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
```

Read operations exclude unavailable products. A product's `name` is unique across the database, including unavailable products, so soft-deleting a product does not free its name for reuse.

## Product Fields

| Field       | Type       | Notes                                                |
| ----------- | ---------- | ---------------------------------------------------- |
| `id`        | `number`   | Auto-incremented identifier.                         |
| `name`      | `string`   | Required and unique.                                 |
| `price`     | `number`   | Required; non-negative, up to four decimal places.   |
| `available` | `boolean`  | Defaults to `true`; set to `false` on soft deletion. |
| `createdAt` | `DateTime` | Set when the record is created.                      |
| `updatedAt` | `DateTime` | Updated when the record changes.                     |

Global validation rejects properties not declared by the request DTOs.

## Tests and Quality

```bash
npm test
npm run test:watch
npm run test:cov
npm run lint
npm run format
```

No unit spec files are currently checked in, so the Jest unit-test commands have no service tests to run yet.

`npm run test:e2e` is configured, but the current e2e test is Nest's generated HTTP `Hello World` test. It does not exercise this TCP microservice and should not be treated as a passing service-level e2e test until replaced with a TCP test.

## Project Layout

```text
src/
  common/       Shared DTOs
  config/       Environment validation
  generated/    Generated Prisma client
  lib/          Prisma service
  products/     Product TCP controller, service, DTOs, and entity
prisma/
  migrations/   Database migrations
  schema.prisma Prisma data model
```

## License

This repository is private and currently does not define a public license.
