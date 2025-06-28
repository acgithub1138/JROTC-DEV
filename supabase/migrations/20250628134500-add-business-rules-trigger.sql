
-- Create a function to execute business rules
CREATE OR REPLACE FUNCTION execute_business_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    condition_met BOOLEAN;
    action RECORD;
BEGIN
    -- Loop through all active business rules for the trigger type and table
    FOR rule IN 
        SELECT * FROM business_rules 
        WHERE is_active = true 
        AND trigger_type = TG_OP || '_' || lower(TG_TABLE_NAME)
        AND (trigger_table IS NULL OR trigger_table = TG_TABLE_NAME)
    LOOP
        -- For now, we'll assume conditions are met (simplified logic)
        -- In a full implementation, you'd evaluate the trigger_conditions JSON
        condition_met := true;
        
        -- If conditions are met, execute actions
        IF condition_met THEN
            -- Update the last_executed timestamp
            UPDATE business_rules 
            SET last_executed = NOW() 
            WHERE id = rule.id;
            
            -- Log that the rule was triggered (you can expand this to actually execute actions)
            RAISE NOTICE 'Business rule % triggered for % on table %', rule.name, TG_OP, TG_TABLE_NAME;
        END IF;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tasks table
DROP TRIGGER IF EXISTS business_rules_trigger_insert ON tasks;
DROP TRIGGER IF EXISTS business_rules_trigger_update ON tasks;
DROP TRIGGER IF EXISTS business_rules_trigger_delete ON tasks;

CREATE TRIGGER business_rules_trigger_insert
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION execute_business_rules();

CREATE TRIGGER business_rules_trigger_update
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION execute_business_rules();

CREATE TRIGGER business_rules_trigger_delete
    AFTER DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION execute_business_rules();
