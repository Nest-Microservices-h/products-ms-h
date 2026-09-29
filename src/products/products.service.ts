import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '@/lib/prisma.service';
import { PaginationDto } from '@/common';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto,
    });

    return product;
  }

  async findAll(paginationDto: PaginationDto) {
    const activeProductWhere = { available: true };
    const { page = 1, limit = 10 } = paginationDto;
    const total = await this.prisma.product.count({
      where: activeProductWhere,
    });
    const lastPage = Math.ceil(total / limit);

    const data = await this.prisma.product.findMany({
      where: activeProductWhere,
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id, available: true },
    });

    if (!product) {
      throw new RpcException({
        message: `Product #${id} not found 😒`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: _, ...data } = updateProductDto;

    await this.findOne(id);

    const newProduct = this.prisma.product.update({
      where: { id },
      data,
    });

    return newProduct;
  }

  async remove(id: number) {
    await this.findOne(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { available: false },
    });
    // const product = await this.prisma.product.delete({ where: { id } });
    return product;
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some products not found 😒',
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return products;
  }
}
