import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';

export interface ProductQueryOptions {
  search?: string;
  category?: string;
  lowStock?: boolean;
  stockStatus?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  page?: number;
  limit?: number;
}

export class ProductService {
  /**
   * List products with search, category filtering, low-stock filter, and pagination
   */
  static async getProducts(options: ProductQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // 1. Search by product name, SKU, or category
    if (options.search && options.search.trim() !== '') {
      const search = options.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 2. Filter by Category
    if (options.category && options.category.trim() !== '' && options.category !== 'ALL') {
      where.category = { equals: options.category.trim(), mode: 'insensitive' };
    }

    // 3. Filter by Stock Status
    if (options.stockStatus === 'OUT_OF_STOCK') {
      where.currentStock = { equals: 0 };
    }

    let products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { stockMovements: true, challanItems: true }
        }
      }
    });

    let total = await prisma.product.count({ where });

    // Handle low-stock condition: currentStock <= minimumStock (if lowStock=true or stockStatus=LOW_STOCK)
    if (options.lowStock || options.stockStatus === 'LOW_STOCK') {
      // Query low-stock products from DB
      const allMatching = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      const lowStockProducts = allMatching.filter((p) => p.currentStock <= p.minimumStock);
      total = lowStockProducts.length;
      products = lowStockProducts.slice(skip, skip + limit) as unknown as typeof products;
    } else if (options.stockStatus === 'IN_STOCK') {
      const allMatching = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      const inStockProducts = allMatching.filter((p) => p.currentStock > p.minimumStock);
      total = inStockProducts.length;
      products = inStockProducts.slice(skip, skip + limit) as unknown as typeof products;
    }

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get distinct categories
   */
  static async getCategories(): Promise<string[]> {
    const records = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });
    return records.map((r) => r.category);
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id }
    });
  }

  /**
   * Create a new product with duplicate SKU check
   */
  static async createProduct(data: CreateProductInput) {
    // Check for SKU conflict
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku }
    });

    if (existing) {
      const error = new Error('A product with this SKU already exists');
      (error as Error & { statusCode: number }).statusCode = 409;
      throw error;
    }

    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: new Prisma.Decimal(data.unitPrice),
        currentStock: data.currentStock,
        minimumStock: data.minimumStock,
        warehouseLocation: data.warehouseLocation
      }
    });
  }

  /**
   * Update existing product (preserves currentStock)
   */
  static async updateProduct(id: string, data: UpdateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { id }
    });

    if (!existing) {
      return null;
    }

    // If SKU changed, check if new SKU is already taken by another product
    if (data.sku && data.sku !== existing.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku: data.sku }
      });
      if (skuConflict && skuConflict.id !== id) {
        const error = new Error('A product with this SKU already exists');
        (error as Error & { statusCode: number }).statusCode = 409;
        throw error;
      }
    }

    // Do NOT update currentStock via this endpoint to protect inventory integrity
    return prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.unitPrice !== undefined && { unitPrice: new Prisma.Decimal(data.unitPrice) }),
        ...(data.minimumStock !== undefined && { minimumStock: data.minimumStock }),
        ...(data.warehouseLocation !== undefined && { warehouseLocation: data.warehouseLocation })
      }
    });
  }
}
