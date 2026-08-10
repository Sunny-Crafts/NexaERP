import { z } from 'zod';

export const challanItemInputSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .min(1, 'Product ID is required')
    .trim(),
  quantity: z
    .preprocess(
      (val) => Number(val),
      z
        .number({ required_error: 'Quantity is required' })
        .int('Quantity must be an integer')
        .positive('Quantity must be greater than zero')
    )
});

export const createChallanSchema = z.object({
  customerId: z
    .string({ required_error: 'Customer ID is required' })
    .min(1, 'Customer ID is required')
    .trim(),
  items: z
    .array(challanItemInputSchema)
    .min(1, 'At least one product item is required in a sales challan')
});

export const updateChallanSchema = z.object({
  customerId: z
    .string()
    .min(1, 'Customer ID is required')
    .trim()
    .optional(),
  items: z
    .array(challanItemInputSchema)
    .min(1, 'At least one product item is required in a sales challan')
    .optional()
});

export type ChallanItemInput = z.infer<typeof challanItemInputSchema>;
export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
