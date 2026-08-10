import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;

    const result = await CustomerService.getCustomers({
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10
    });

    return sendSuccess(res, 'Customers retrieved successfully', result, 200);
  } catch (error) {
    console.error('Get customers error:', error);
    return sendError(res, 'Failed to retrieve customers', undefined, 500);
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await CustomerService.getCustomerById(id);

    if (!result) {
      return sendError(res, 'Customer not found', undefined, 404);
    }

    return sendSuccess(res, 'Customer retrieved successfully', result, 200);
  } catch (error) {
    console.error('Get customer by ID error:', error);
    return sendError(res, 'Failed to retrieve customer details', undefined, 500);
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = await CustomerService.createCustomer(req.body);
    return sendSuccess(res, 'Customer created successfully', { customer }, 201);
  } catch (error) {
    console.error('Create customer error:', error);
    return sendError(res, 'Failed to create customer', undefined, 500);
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await CustomerService.updateCustomer(id, req.body);

    if (!customer) {
      return sendError(res, 'Customer not found', undefined, 404);
    }

    return sendSuccess(res, 'Customer updated successfully', { customer }, 200);
  } catch (error) {
    console.error('Update customer error:', error);
    return sendError(res, 'Failed to update customer', undefined, 500);
  }
};

export const createFollowUp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: customerId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'Authentication required', undefined, 401);
    }

    const followUp = await CustomerService.createFollowUp(customerId, userId, req.body);

    if (!followUp) {
      return sendError(res, 'Customer not found', undefined, 404);
    }

    return sendSuccess(res, 'Follow-up recorded successfully', { followUp }, 201);
  } catch (error) {
    console.error('Create follow-up error:', error);
    return sendError(res, 'Failed to record follow-up', undefined, 500);
  }
};
