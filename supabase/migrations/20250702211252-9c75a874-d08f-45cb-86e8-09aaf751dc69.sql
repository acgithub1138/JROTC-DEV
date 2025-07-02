-- Update inventory_items table to match new schema requirements
ALTER TABLE public.inventory_items 
RENAME COLUMN name TO item;

-- Add new columns to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN item_id text,
ADD COLUMN sub_category text,
ADD COLUMN size text,
ADD COLUMN gender text CHECK (gender IN ('M', 'F')),
ADD COLUMN qty_total integer DEFAULT 0,
ADD COLUMN qty_issued integer DEFAULT 0,
ADD COLUMN issued_to uuid[],
ADD COLUMN stock_number text,
ADD COLUMN unit_of_measure text CHECK (unit_of_measure IN ('EA', 'PR')),
ADD COLUMN has_serial_number boolean DEFAULT false,
ADD COLUMN model_number text,
ADD COLUMN returnable boolean DEFAULT false,
ADD COLUMN accountable boolean DEFAULT false,
ADD COLUMN pending_updates integer DEFAULT 0,
ADD COLUMN pending_issue_changes integer DEFAULT 0,
ADD COLUMN pending_write_offs integer DEFAULT 0;

-- Create computed column for qty_available
ALTER TABLE public.inventory_items 
ADD COLUMN qty_available integer GENERATED ALWAYS AS (qty_total - qty_issued) STORED;

-- Update RLS policies for inventory management
CREATE POLICY "Instructors can manage inventory in their school" 
ON public.inventory_items 
FOR ALL 
USING ((school_id = get_current_user_school_id()) AND (get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])))
WITH CHECK ((school_id = get_current_user_school_id()) AND (get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])));

-- Add index for better search performance
CREATE INDEX idx_inventory_items_search ON public.inventory_items USING GIN (
  to_tsvector('english', COALESCE(item, '') || ' ' || COALESCE(category, '') || ' ' || COALESCE(sub_category, '') || ' ' || COALESCE(item_id, '') || ' ' || COALESCE(size, '') || ' ' || COALESCE(stock_number, ''))
);