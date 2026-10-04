# Products Microservice

NestJS microservice that manages products over NATS. It uses Prisma ORM 7 with SQLite, supports product creation, pagination, updates, validation, and soft deletion, and exposes all operations as RPC message patterns instead of an HTTP endpoint.

## Requirements

- Node.js 20 or later
- npm
- A running NATS server

## Setup

```bash
git clone https://github.com/Nest-Microservices-h/products-ms-h.git
cd products-ms-h
npm install
```

Create the local environment file from the template:

```bash
cp .env.template .env
```

On PowerShell, use `Copy-Item .env.template .env` instead.

The template contains:

```env
PORT=3001
DATABASE_URL="file:./dev.db"
NATS_SERVERS="nats://localhost:4222,nats://localhost:4223"
```

- `PORT` is used by the application runtime and must be present.
- `DATABASE_URL` is required by Prisma and the SQLite driver; change it to use a different database file if needed.
- `NATS_SERVERS` is a comma-separated list of NATS nodes the microservice connects to.

## Database

Apply the migrations and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

Run `npx prisma generate` again after changing `prisma/schema.prisma`. In production-like environments, prefer:

```bash
npx prisma migrate deploy
```

## Run

Start the NATS broker first, then start the service:

```bash
npm run start:dev
```

Or build and run the production artifact:

```bash
npm run build
npm run start:prod
```

The service connects to NATS using the configured servers and listens for RPC messages on the defined command patterns.

## NATS API

Each request uses a Nest message pattern in the form `{ cmd: string }`. The client can be created with `ClientProxyFactory` from `@nestjs/microservices`:

```ts
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

const client = ClientProxyFactory.create({
  transport: Transport.NATS,
  options: { servers: ['nats://localhost:4222', 'nats://localhost:4223'] },
});

const product = await firstValueFrom(
  client.send({ cmd: 'create-product' }, { name: 'Keyboard', price: 49.99 }),
);

await client.close();
```

| Pattern             | Payload                                         | Behavior                                                                                                             |
| ------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `create-product`    | `{ name: string, price: number }`               | Creates an available product. Names must be unique and price must be non-negative with at most four decimal places. |
| `find-all-products` | `{ page?: number, limit?: number }`             | Returns active products; values must be positive. Defaults are `page: 1` and `limit: 10`.                          |
| `find-one-product`  | `{ id: number }`                                | Returns one available product.                                                                                       |
| `update-product`    | `{ id: number, name?: string, price?: number }` | Updates supplied fields of an available product.                                                                     |
| `remove-product`    | `{ id: number }`                                | Marks the product as unavailable; it does not delete the row.                                                       |
| `validate-products` | `number[]`                                      | Returns products for all requested IDs, or raises an RPC error if any ID is missing.                               |

The `find-all-products` response shape is:

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

Read operations exclude unavailable products. A product name is unique across the database, including soft-deleted products, so removing a product does not make its name available again.

## Product Fields

| Field       | Type       | Notes                                               |
| ----------- | ---------- | --------------------------------------------------- |
| `id`        | `number`   | Auto-incremented identifier.                        |
| `name`      | `string`   | Required and unique.                                |
| `price`     | `number`   | Required; non-negative, up to four decimal places.  |
| `available` | `boolean`  | Defaults to `true`; set to `false` on soft deletion. |
| `createdAt` | `DateTime` | Set when the record is created.                     |
| `updatedAt` | `DateTime` | Updated whenever the record changes.                |

Global validation rejects fields that are not declared in the request DTOs.

## Tests and Quality

```bash
npm test
npm run test:watch
npm run test:cov
npm run lint
npm run format
```

No unit spec files are currently checked in, so the Jest unit-test commands do not yet exercise a product service test suite.

`npm run test:e2e` is configured, but the default generated Nest test is an HTTP `Hello World` example and does not validate the NATS microservice behavior.

## Project Layout

```text
src/
  common/       Shared DTOs and pagination helpers
  config/       Environment validation and config loading
  lib/          Prisma service integration
  products/     Product controller, service, DTOs, and entity
prisma/
  migrations/   Database migrations
  schema.prisma Prisma data model
```

## License

This repository is private and currently does not define a public license.
