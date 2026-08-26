import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient {
  private logger = new Logger('PrismaService');
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
    super({ adapter });
    this.logger.log('PrismaService initialized 👍');
  }
}
