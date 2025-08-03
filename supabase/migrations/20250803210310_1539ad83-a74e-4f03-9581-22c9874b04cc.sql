-- Add school_name column to cp_comp_schools table
ALTER TABLE cp_comp_schools ADD COLUMN school_name TEXT;

-- Create a function to populate existing records with school names
CREATE OR REPLACE FUNCTION populate_comp_schools_names()
RETURNS void AS $$
BEGIN
  UPDATE cp_comp_schools 
  SET school_name = schools.name
  FROM schools 
  WHERE cp_comp_schools.school_id = schools.id 
  AND cp_comp_schools.school_name IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Populate existing records
SELECT populate_comp_schools_names();

-- Create trigger to automatically populate school_name when inserting/updating
CREATE OR REPLACE FUNCTION set_comp_school_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Get school name and set it
  SELECT name INTO NEW.school_name
  FROM schools
  WHERE id = NEW.school_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger
CREATE TRIGGER trigger_set_comp_school_name
  BEFORE INSERT OR UPDATE ON cp_comp_schools
  FOR EACH ROW
  EXECUTE FUNCTION set_comp_school_name();