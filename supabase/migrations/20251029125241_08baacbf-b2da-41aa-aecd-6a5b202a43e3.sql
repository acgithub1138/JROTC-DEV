-- Add branch, rank, and bio columns to cp_judges table
ALTER TABLE cp_judges 
ADD COLUMN branch text,
ADD COLUMN rank text,
ADD COLUMN bio text;