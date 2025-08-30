-- Change hours column from integer to numeric to allow decimal values
ALTER TABLE public.community_service 
ALTER COLUMN hours TYPE numeric USING hours::numeric;