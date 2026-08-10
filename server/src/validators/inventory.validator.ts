import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createMovementSchema = z.object({
  productId: z
    .string({ required_error: 'Product is required' })
    .min(1, 'Product is required')
    .trim(),
  type: z.nativeEnum(StockMovementType, {
    errorMap: () => ({ message: 'Movement type must be IN or OUT' })
  }),
  quantity: z
    .preprocess(
      (val) => Number(val),
      z
        .number({ required_error: 'Quantity is required' })
        .int('Quantity must be an integer')
        .positive('Quantity must be greater than zero')
    ),
  reason: z
    .string({ required_error: 'Reason is required' })
    .min(2, 'Reason must be at least 2 characters')
    .trim()
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
