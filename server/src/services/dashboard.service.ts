import { prisma } from '../config/prisma';
import { CustomerStatus, ChallanStatus } from '@prisma/client';

export class DashboardService {
  /**
   * Get dynamic dashboard KPI statistics directly from the database
   */
  static async getStats() {
    // 1. Calculate today's start and end timestamps in server time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Query data in parallel
    const [
      customers,
      products,
      challansAll,
      challansTodayCount
    ] = await Promise.all([
      // Customers
      prisma.customer.findMany({
        select: { status: true }
      }),
      // Products
      prisma.product.findMany({
        select: { id: true, currentStock: true, minimumStock: true }
      }),
      // Challans status counts
      prisma.challan.findMany({
        select: { status: true }
      }),
      // Challans created today
      prisma.challan.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      })
    ]);

    // Customer statistics
    let activeCustomers = 0;
    let leadCustomers = 0;
    let inactiveCustomers = 0;

    for (const c of customers) {
      if (c.status === CustomerStatus.ACTIVE) activeCustomers += 1;
      else if (c.status === CustomerStatus.LEAD) leadCustomers += 1;
      else if (c.status === CustomerStatus.INACTIVE) inactiveCustomers += 1;
    }

    // Product & Inventory statistics
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    let totalStockUnits = 0;

    for (const p of products) {
      totalStockUnits += p.currentStock;
      if (p.currentStock === 0) {
        outOfStockProducts += 1;
      }
      if (p.currentStock <= p.minimumStock) {
        lowStockProducts += 1;
      }
    }

    // Challan statistics
    let draftChallans = 0;
    let confirmedChallans = 0;
    let cancelledChallans = 0;

    for (const ch of challansAll) {
      if (ch.status === ChallanStatus.DRAFT) draftChallans += 1;
      else if (ch.status === ChallanStatus.CONFIRMED) confirmedChallans += 1;
      else if (ch.status === ChallanStatus.CANCELLED) cancelledChallans += 1;
    }

    return {
      customers: {
        total: customers.length,
        active: activeCustomers,
        leads: leadCustomers,
        inactive: inactiveCustomers
      },
      products: {
        total: products.length,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      inventory: {
        totalStockUnits
      },
      challans: {
        today: challansTodayCount,
        draft: draftChallans,
        confirmed: confirmedChallans,
        cancelled: cancelledChallans
      }
    };
  }

  /**
   * Get latest 5-10 sales challans
   */
  static async getRecentChallans(limit = 6) {
    const challans = await prisma.challan.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessName: true,
            customerType: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return challans.map((c) => ({
      id: c.id,
      challanNumber: c.challanNumber,
      customerId: c.customerId,
      customer: c.customer,
      totalQuantity: c.totalQuantity,
      status: c.status,
      createdBy: c.user,
      createdAt: c.createdAt
    }));
  }

  /**
   * Get latest 5-10 stock movements
   */
  static async getRecentStockMovements(limit = 6) {
    const movements = await prisma.stockMovement.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            currentStock: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      product: m.product,
      quantity: m.quantity,
      type: m.type,
      reason: m.reason,
      createdBy: m.user,
      createdAt: m.createdAt
    }));
  }

  /**
   * Get low-stock products sorted by highest stock urgency
   */
  static async getLowStockProducts(limit = 8) {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Filter where currentStock <= minimumStock and sort by urgency (0 stock first, then ascending currentStock)
    const lowStock = products
      .filter((p) => p.currentStock <= p.minimumStock)
      .sort((a, b) => {
        if (a.currentStock === 0 && b.currentStock !== 0) return -1;
        if (b.currentStock === 0 && a.currentStock !== 0) return 1;
        return a.currentStock - b.currentStock;
      })
      .slice(0, limit);

    return lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minimumStock: p.minimumStock,
      warehouseLocation: p.warehouseLocation
    }));
  }
}
