-- Add column preferences to user sidebar preferences table
ALTER TABLE user_sidebar_preferences 
ADD COLUMN inventory_columns jsonb DEFAULT '["item", "category", "sub_category", "qty_total", "qty_available", "status"]'::jsonb;