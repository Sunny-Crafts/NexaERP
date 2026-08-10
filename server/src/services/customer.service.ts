import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { 
  CreateCustomerInput, 
  UpdateCustomerInput, 
  CreateFollowUpInput 
} from '../validators/customer.validator';

export interface CustomerQueryOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export class CustomerService {
  /**
   * List customers with search and pagination
   */
  static async getCustomers(options: CustomerQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (options.search && options.search.trim() !== '') {
      const search = options.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { followUps: true, challans: true }
          }
        }
      }),
      prisma.customer.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get single customer with follow-up history
   */
  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!customer) {
      return null;
    }

    const { followUps, ...customerData } = customer;

    return {
      customer: customerData,
      followUps
    };
  }

  /**
   * Create a new customer
   */
  static async createCustomer(data: CreateCustomerInput) {
    return prisma.customer.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate,
        notes: data.notes
      }
    });
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: string, data: UpdateCustomerInput) {
    const existing = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existing) {
      return null;
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.mobile !== undefined && { mobile: data.mobile }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
        ...(data.customerType !== undefined && { customerType: data.customerType }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.followUpDate !== undefined && { followUpDate: data.followUpDate }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });
  }

  /**
   * Add a follow-up record to a customer
   */
  static async createFollowUp(customerId: string, userId: string, data: CreateFollowUpInput) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return null;
    }

    const [followUp] = await prisma.$transaction([
      prisma.customerFollowUp.create({
        data: {
          customerId,
          createdBy: userId,
          note: data.note,
          followUpDate: data.followUpDate
        },
        include: {
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
      prisma.customer.update({
        where: { id: customerId },
        data: {
          followUpDate: data.followUpDate
        }
      })
    ]);

    return followUp;
  }
}
