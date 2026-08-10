import { Prisma, StockMovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateMovementInput } from '../validators/inventory.validator';

export class InsufficientStockError extends Error {
  statusCode: number;
  available: number;
  requested: number;

  constructor(available: number, requested: number) {
    super('Insufficient stock');
    this.name = 'InsufficientStockError';
    this.statusCode = 409;
    this.available = available;
    this.requested = requested;
  }
}

export interface MovementQueryOptions {
  productId?: string;
  type?: StockMovementType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export class InventoryService {
  /**
   * Get overall inventory summary and statistics
   */
  static async getSummary(): Promise<InventorySummary> {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        currentStock: true,
        minimumStock: true
      }
    });

    const totalProducts = products.length;
    let totalStockUnits = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    for (const p of products) {
      totalStockUnits += p.currentStock;
      if (p.currentStock === 0) {
        outOfStockProducts += 1;
      }
      if (p.currentStock <= p.minimumStock) {
        lowStockProducts += 1;
      }
    }

    return {
      totalProducts,
      totalStockUnits,
      lowStockProducts,
      outOfStockProducts
    };
  }

  /**
   * List stock movements with pagination, product filter, and movement type filter
   */
  static async getMovements(options: MovementQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {};

    if (options.productId && options.productId.trim() !== '' && options.productId !== 'ALL') {
      where.productId = options.productId.trim();
    }

    if (options.type && (options.type === 'IN' || options.type === 'OUT')) {
      where.type = options.type;
    }

    if (options.search && options.search.trim() !== '') {
      const search = options.search.trim();
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              currentStock: true,
              minimumStock: true,
              warehouseLocation: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      movements: movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        quantity: m.quantity,
        type: m.type,
        reason: m.reason,
        createdAt: m.createdAt,
        product: m.product,
        createdBy: m.user
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Create Stock Movement atomically using a Prisma Database Transaction
   * Prevents negative stock and guarantees consistency.
   */
  static async createStockMovement(data: CreateMovementInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch current product record inside the transaction
      const product = await tx.product.findUnique({
        where: { id: data.productId }
      });

      if (!product) {
        const error = new Error('Product not found');
        (error as Error & { statusCode: number }).statusCode = 404;
        throw error;
      }

      // 2. Validate stock sufficiency for OUT movements
      if (data.type === 'OUT' && product.currentStock < data.quantity) {
        throw new InsufficientStockError(product.currentStock, data.quantity);
      }

      // 3. Compute new stock level
      const newStock =
        data.type === 'IN'
          ? product.currentStock + data.quantity
          : product.currentStock - data.quantity;

      // 4. Update Product stock atomically
      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newStock }
      });

      // 5. Record StockMovement
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason,
          createdBy: userId
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              currentStock: true,
              minimumStock: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      return {
        movement: {
          id: movement.id,
          productId: movement.productId,
          quantity: movement.quantity,
          type: movement.type,
          reason: movement.reason,
          createdAt: movement.createdAt,
          product: movement.product,
          createdBy: movement.user
        },
        updatedProduct: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          sku: updatedProduct.sku,
          currentStock: updatedProduct.currentStock,
          previousStock: product.currentStock
        }
      };
    });
  }

  /**
   * Helper method for transactional stock adjustment (Designed for reuse by Challan module)
   */
  static async adjustStockTransactional(
    tx: Prisma.TransactionClient,
    params: {
      productId: string;
      quantity: number;
      type: StockMovementType;
      reason: string;
      createdBy: string;
    }
  ) {
    const product = await tx.product.findUnique({
      where: { id: params.productId }
    });

    if (!product) {
      throw new Error(`Product with ID ${params.productId} not found`);
    }

    if (params.type === 'OUT' && product.currentStock < params.quantity) {
      throw new InsufficientStockError(product.currentStock, params.quantity);
    }

    const newStock =
      params.type === 'IN'
        ? product.currentStock + params.quantity
        : product.currentStock - params.quantity;

    await tx.product.update({
      where: { id: params.productId },
      data: { currentStock: newStock }
    });

    return tx.stockMovement.create({
      data: {
        productId: params.productId,
        quantity: params.quantity,
        type: params.type,
        reason: params.reason,
        createdBy: params.createdBy
      }
    });
  }
}
