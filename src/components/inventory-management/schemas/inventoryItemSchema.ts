import { z } from 'zod';

export const inventoryItemSchema = z.object({
  item_id: z.string().min(1, 'Item ID is required'),
  item: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  sub_category: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  gender: z.enum(['M', 'F']).nullable().optional(),
  qty_total: z.number().min(0, 'Total quantity must be non-negative').optional().default(0),
  qty_issued: z.number().min(0, 'Issued quantity must be non-negative').optional().default(0),
  issued_to: z.array(z.string()).optional(),
  stock_number: z.string().optional().nullable(),
  unit_of_measure: z.enum(['EA', 'PR']).nullable().optional(),
  has_serial_number: z.boolean().default(false).optional(),
  model_number: z.string().optional().nullable(),
  returnable: z.boolean().default(false).optional(),
  accountable: z.boolean().default(false).optional(),
  pending_updates: z.number().min(0).default(0).optional(),
  pending_issue_changes: z.number().min(0).default(0).optional(),
  pending_write_offs: z.number().min(0).default(0).optional(),
  description: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => (data.qty_issued || 0) <= (data.qty_total || 0),
  {
    message: "Issued quantity cannot exceed total quantity",
    path: ["qty_issued"],
  }
);

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;