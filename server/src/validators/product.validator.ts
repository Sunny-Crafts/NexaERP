import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(2, 'Product name must be at least 2 characters')
    .trim(),
  sku: z
    .string({ required_error: 'SKU is required' })
    .min(2, 'SKU must be at least 2 characters')
    .trim()
    .toUpperCase(),
  category: z
    .string({ required_error: 'Category is required' })
    .min(2, 'Category must be at least 2 characters')
    .trim(),
  unitPrice: z
    .preprocess((val) => Number(val), z.number({ required_error: 'Unit price is required' }))
    .refine((val) => val > 0, { message: 'Unit price must be greater than 0' }),
  currentStock: z
    .preprocess(
      (val) => (val !== undefined && val !== '' ? Number(val) : 0),
      z.number().int('Current stock must be an integer').nonnegative('Stock cannot be negative')
    )
    .default(0),
  minimumStock: z
    .preprocess(
      (val) => (val !== undefined && val !== '' ? Number(val) : 0),
      z.number().int('Minimum stock must be an integer').nonnegative('Minimum stock cannot be negative')
    )
    .default(0),
  warehouseLocation: z
    .string({ required_error: 'Warehouse location is required' })
    .min(2, 'Warehouse location is required')
    .trim()
});

export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .trim()
    .optional(),
  sku: z
    .string()
    .min(2, 'SKU must be at least 2 characters')
    .trim()
    .toUpperCase()
    .optional(),
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .trim()
    .optional(),
  unitPrice: z
    .preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().optional())
    .refine((val) => val === undefined || val > 0, { message: 'Unit price must be greater than 0' }),
  minimumStock: z
    .preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().int().optional())
    .refine((val) => val === undefined || val >= 0, { message: 'Minimum stock cannot be negative' }),
  warehouseLocation: z
    .string()
    .min(2, 'Warehouse location is required')
    .trim()
    .optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
