import { z } from 'zod';

export const inventoryItemSchema = z.object({
  item_id: z.string().optional(),
  item: z.string().min(1, 'Item name is required'),
  category: z.string().optional(),
  sub_category: z.string().optional(),
  size: z.string().optional(),
  gender: z.enum(['M', 'F']).nullable().optional(),
  qty_total: z.number().min(0, 'Total quantity must be non-negative'),
  qty_issued: z.number().min(0, 'Issued quantity must be non-negative'),
  issued_to: z.array(z.string()).optional(),
  stock_number: z.string().optional(),
  unit_of_measure: z.enum(['EA', 'PR']).nullable().optional(),
  has_serial_number: z.boolean().default(false),
  model_number: z.string().optional(),
  returnable: z.boolean().default(false),
  accountable: z.boolean().default(false),
  pending_updates: z.number().min(0).default(0),
  pending_issue_changes: z.number().min(0).default(0),
  pending_write_offs: z.number().min(0).default(0),
  description: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.qty_issued <= data.qty_total,
  {
    message: "Issued quantity cannot exceed total quantity",
    path: ["qty_issued"],
  }
);

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;