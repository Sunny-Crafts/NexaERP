import { Prisma, ChallanStatus, StockMovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateChallanInput, UpdateChallanInput, ChallanItemInput } from '../validators/challan.validator';

export class ChallanStockError extends Error {
  statusCode: number;
  product: { id: string; name: string; sku: string };
  available: number;
  requested: number;

  constructor(
    productName: string,
    product: { id: string; name: string; sku: string },
    available: number,
    requested: number
  ) {
    super(`Insufficient stock for ${productName}`);
    this.name = 'ChallanStockError';
    this.statusCode = 409;
    this.product = product;
    this.available = available;
    this.requested = requested;
  }
}

export interface ChallanQueryOptions {
  status?: ChallanStatus | 'ALL';
  search?: string;
  page?: number;
  limit?: number;
}

export class ChallanService {
  /**
   * Generates sequential, collision-safe Challan Numbers like SC-00001, SC-00002...
   */
  static async generateChallanNumber(tx?: Prisma.TransactionClient): Promise<string> {
    const db = tx || prisma;
    const latest = await db.challan.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { challanNumber: true }
    });

    let nextNumber = 1;
    if (latest && latest.challanNumber) {
      const match = latest.challanNumber.match(/SC-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `SC-${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Helper to merge duplicate product items from user input
   */
  private static mergeDuplicateItems(items: ChallanItemInput[]): ChallanItemInput[] {
    const map = new Map<string, number>();
    for (const item of items) {
      const current = map.get(item.productId) || 0;
      map.set(item.productId, current + item.quantity);
    }
    return Array.from(map.entries()).map(([productId, quantity]) => ({
      productId,
      quantity
    }));
  }

  /**
   * Create a new Sales Challan as DRAFT (Stock is NOT reduced on draft creation)
   */
  static async createChallan(data: CreateChallanInput, userId: string) {
    // 1. Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!customer) {
      const error = new Error('Customer not found');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    // 2. Merge duplicate line items
    const mergedItems = this.mergeDuplicateItems(data.items);

    // 3. Fetch current product information for each item to store SNAPSHOTS
    const productIds = mergedItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingId = productIds.find((id) => !foundIds.has(id));
      const error = new Error(`Product with ID ${missingId} was not found`);
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 4. Calculate total quantity and prepare snapshots
    let totalQuantity = 0;
    const itemsData = mergedItems.map((item) => {
      const p = productMap.get(item.productId)!;
      totalQuantity += item.quantity;
      return {
        productId: item.productId,
        productNameSnapshot: p.name,
        skuSnapshot: p.sku,
        unitPriceSnapshot: p.unitPrice,
        quantity: item.quantity
      };
    });

    // 5. Generate unique challan number and insert draft
    return prisma.$transaction(async (tx) => {
      const challanNumber = await this.generateChallanNumber(tx);

      return tx.challan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          totalQuantity,
          status: ChallanStatus.DRAFT,
          createdBy: userId,
          items: {
            create: itemsData
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
              email: true,
              customerType: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          items: true
        }
      });
    });
  }

  /**
   * List Sales Challans with search, status filtering, and pagination
   */
  static async getChallans(options: ChallanQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ChallanWhereInput = {};

    if (options.status && options.status !== 'ALL') {
      where.status = options.status as ChallanStatus;
    }

    if (options.search && options.search.trim() !== '') {
      const search = options.search.trim();
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              businessName: true,
              mobile: true,
              email: true,
              customerType: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: { items: true }
          }
        }
      }),
      prisma.challan.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      challans: challans.map((c) => ({
        id: c.id,
        challanNumber: c.challanNumber,
        customerId: c.customerId,
        totalQuantity: c.totalQuantity,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        customer: c.customer,
        createdBy: c.user,
        itemCount: c._count.items
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
   * Get single Challan detail with historical snapshots
   */
  static async getChallanById(id: string) {
    return prisma.challan.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessName: true,
            mobile: true,
            email: true,
            address: true,
            gstNumber: true,
            customerType: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                currentStock: true,
                warehouseLocation: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Edit a DRAFT Challan (Cannot edit CONFIRMED or CANCELLED challans)
   */
  static async updateChallan(id: string, data: UpdateChallanInput) {
    const existing = await prisma.challan.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      return null;
    }

    if (existing.status !== ChallanStatus.DRAFT) {
      const error = new Error('Only draft challans can be edited');
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    // If customerId is modified, check customer exists
    if (data.customerId && data.customerId !== existing.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      });
      if (!customer) {
        const error = new Error('Customer not found');
        (error as Error & { statusCode: number }).statusCode = 404;
        throw error;
      }
    }

    return prisma.$transaction(async (tx) => {
      let totalQuantity = existing.totalQuantity;

      // If items are being replaced
      if (data.items && data.items.length > 0) {
        const mergedItems = this.mergeDuplicateItems(data.items);
        const productIds = mergedItems.map((item) => item.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } }
        });

        if (products.length !== productIds.length) {
          const foundIds = new Set(products.map((p) => p.id));
          const missingId = productIds.find((i) => !foundIds.has(i));
          throw new Error(`Product with ID ${missingId} was not found`);
        }

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Remove old items
        await tx.challanItem.deleteMany({
          where: { challanId: id }
        });

        // Rebuild items with fresh snapshots
        totalQuantity = 0;
        const newItemsData = mergedItems.map((item) => {
          const p = productMap.get(item.productId)!;
          totalQuantity += item.quantity;
          return {
            challanId: id,
            productId: item.productId,
            productNameSnapshot: p.name,
            skuSnapshot: p.sku,
            unitPriceSnapshot: p.unitPrice,
            quantity: item.quantity
          };
        });

        await tx.challanItem.createMany({
          data: newItemsData
        });
      }

      // Update main challan metadata
      return tx.challan.update({
        where: { id },
        data: {
          ...(data.customerId && { customerId: data.customerId }),
          totalQuantity
        },
        include: {
          customer: true,
          user: {
            select: { id: true, name: true, role: true }
          },
          items: true
        }
      });
    });
  }

  /**
   * CONFIRM CHALLAN (CRITICAL BUSINESS TRANSACTION)
   * 1. Validates DRAFT status
   * 2. Checks stock for every product line
   * 3. Atomically reduces product stock and generates StockMovement OUT records
   * 4. Marks Challan as CONFIRMED
   */
  static async confirmChallan(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch Challan with line items
      const challan = await tx.challan.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true
        }
      });

      if (!challan) {
        const error = new Error('Challan not found');
        (error as Error & { statusCode: number }).statusCode = 404;
        throw error;
      }

      if (challan.status === ChallanStatus.CONFIRMED) {
        const error = new Error('Challan is already confirmed');
        (error as Error & { statusCode: number }).statusCode = 400;
        throw error;
      }

      if (challan.status === ChallanStatus.CANCELLED) {
        const error = new Error('Cancelled challans cannot be confirmed');
        (error as Error & { statusCode: number }).statusCode = 400;
        throw error;
      }

      if (challan.items.length === 0) {
        const error = new Error('Cannot confirm a challan with no product items');
        (error as Error & { statusCode: number }).statusCode = 400;
        throw error;
      }

      // 2. Validate stock availability for all products in the challan
      for (const item of challan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product ${item.productNameSnapshot} (${item.skuSnapshot}) was not found in catalog`);
        }

        if (product.currentStock < item.quantity) {
          throw new ChallanStockError(
            item.productNameSnapshot,
            { id: product.id, name: product.name, sku: product.sku },
            product.currentStock,
            item.quantity
          );
        }
      }

      // 3. Atomically reduce product stocks & record StockMovement OUT records
      for (const item of challan.items) {
        // Decrease stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });

        // Record stock movement OUT with reference to Challan Number
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: StockMovementType.OUT,
            reason: `Sales Challan ${challan.challanNumber} (${challan.customer.name})`,
            createdBy: userId
          }
        });
      }

      // 4. Update Challan status to CONFIRMED
      return tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.CONFIRMED
        },
        include: {
          customer: true,
          user: {
            select: { id: true, name: true, role: true }
          },
          items: true
        }
      });
    });
  }

  /**
   * CANCEL CHALLAN (DRAFT -> CANCELLED only)
   * Confirmed challans cannot be cancelled.
   */
  static async cancelChallan(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id }
    });

    if (!challan) {
      return null;
    }

    if (challan.status === ChallanStatus.CONFIRMED) {
      const error = new Error('Confirmed challans cannot be cancelled');
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      const error = new Error('Challan is already cancelled');
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    // Mark as CANCELLED (No stock changes)
    return prisma.challan.update({
      where: { id },
      data: { status: ChallanStatus.CANCELLED },
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, role: true }
        },
        items: true
      }
    });
  }
}
