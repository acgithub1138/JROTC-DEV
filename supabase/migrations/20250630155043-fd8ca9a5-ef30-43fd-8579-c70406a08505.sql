
-- Drop and recreate the business rules function with proper text handling
DROP FUNCTION IF EXISTS execute_business_rules() CASCADE;

-- Create enhanced business rule execution function with proper text column handling
CREATE OR REPLACE FUNCTION execute_business_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    action RECORD;
    condition_met BOOLEAN := true;
    log_id UUID;
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    execution_time INTEGER;
    target_record_id UUID;
    before_values JSONB;
    after_values JSONB;
    current_school_id UUID;
    constructed_trigger_type TEXT;
    action_result TEXT;
    condition_group RECORD;
    condition_item RECORD;
    field_value TEXT;
    expected_value TEXT;
    operator_type TEXT;
BEGIN
    -- Get the current school ID from the record or user context
    IF TG_TABLE_NAME = 'tasks' THEN
        IF TG_OP = 'DELETE' THEN
            current_school_id := OLD.school_id;
        ELSE
            current_school_id := NEW.school_id;
        END IF;
    ELSE
        -- Fallback to user's school if available
        SELECT school_id INTO current_school_id FROM public.profiles WHERE id = auth.uid();
    END IF;
    
    -- Skip if no school context
    IF current_school_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Get the target record ID and before values
    IF TG_OP = 'DELETE' THEN
        target_record_id := OLD.id;
        before_values := to_jsonb(OLD);
    ELSE
        target_record_id := NEW.id;
        before_values := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
    END IF;
    
    -- Construct the trigger type (e.g., 'INSERT_tasks', 'UPDATE_tasks')
    constructed_trigger_type := TG_OP || '_' || lower(TG_TABLE_NAME);
    
    -- Loop through all active business rules for this trigger
    FOR rule IN 
        SELECT * FROM business_rules 
        WHERE is_active = true 
        AND trigger_type = constructed_trigger_type
        AND (trigger_table IS NULL OR trigger_table = TG_TABLE_NAME)
        AND school_id = current_school_id
    LOOP
        -- Evaluate conditions
        condition_met := true;
        
        -- Check each condition group (AND logic between groups, OR logic within groups)
        FOR condition_group IN SELECT * FROM jsonb_array_elements(rule.trigger_conditions)
        LOOP
            -- For each condition in the group, check if any match (OR logic)
            condition_met := false;
            
            FOR condition_item IN SELECT * FROM jsonb_array_elements(condition_group->'conditions')
            LOOP
                -- Get the field value from the record
                IF TG_TABLE_NAME = 'tasks' THEN
                    CASE condition_item->>'field'
                        WHEN 'status' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.status ELSE NEW.status END;
                        WHEN 'priority' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.priority ELSE NEW.priority END;
                        WHEN 'assigned_to' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.assigned_to::text ELSE NEW.assigned_to::text END;
                        WHEN 'title' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.title ELSE NEW.title END;
                        WHEN 'description' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.description ELSE NEW.description END;
                        WHEN 'task_number' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.task_number ELSE NEW.task_number END;
                        WHEN 'due_date' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.due_date::text ELSE NEW.due_date::text END;
                        WHEN 'assigned_by' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.assigned_by::text ELSE NEW.assigned_by::text END;
                        WHEN 'team_id' THEN 
                            field_value := CASE WHEN TG_OP = 'DELETE' THEN OLD.team_id::text ELSE NEW.team_id::text END;
                        ELSE
                            field_value := NULL;
                    END CASE;
                END IF;
                
                expected_value := condition_item->>'value';
                operator_type := condition_item->>'operator';
                
                -- Evaluate the condition based on operator
                CASE operator_type
                    WHEN 'equals' THEN
                        IF field_value = expected_value THEN
                            condition_met := true;
                            EXIT; -- Exit the condition loop (OR logic satisfied)
                        END IF;
                    WHEN 'not_equals' THEN
                        IF field_value != expected_value THEN
                            condition_met := true;
                            EXIT;
                        END IF;
                    WHEN 'is_null' THEN
                        IF field_value IS NULL THEN
                            condition_met := true;
                            EXIT;
                        END IF;
                    WHEN 'is_not_null' THEN
                        IF field_value IS NOT NULL THEN
                            condition_met := true;
                            EXIT;
                        END IF;
                    ELSE
                        -- Default to true for unknown operators
                        condition_met := true;
                        EXIT;
                END CASE;
            END LOOP;
            
            -- If no condition in this group matched, overall condition fails
            IF NOT condition_met THEN
                EXIT; -- Exit condition group loop
            END IF;
        END LOOP;
        
        -- If conditions are not met, skip this rule
        IF NOT condition_met AND jsonb_array_length(rule.trigger_conditions) > 0 THEN
            CONTINUE;
        END IF;
        
        -- Process each action in the rule
        FOR action IN SELECT * FROM jsonb_array_elements(rule.actions)
        LOOP
            -- Start timing for this action
            start_time := clock_timestamp();
            log_id := NULL;
            action_result := 'success';
            
            BEGIN
                -- Create log entry for this action
                INSERT INTO public.business_rule_logs (
                    business_rule_id,
                    trigger_event,
                    target_table,
                    target_record_id,
                    action_type,
                    action_details,
                    before_values,
                    school_id
                ) VALUES (
                    rule.id,
                    TG_OP,
                    TG_TABLE_NAME,
                    target_record_id,
                    action->>'type',
                    action,
                    before_values,
                    current_school_id
                ) RETURNING id INTO log_id;
                
                -- Execute the action based on type
                CASE action->>'type'
                    WHEN 'update_record' THEN
                        -- Update the current record
                        IF TG_TABLE_NAME = 'tasks' AND TG_OP != 'DELETE' THEN
                            -- Handle different field types dynamically
                            CASE action->'parameters'->>'field'
                                WHEN 'status' THEN
                                    UPDATE tasks 
                                    SET status = action->'parameters'->>'value',
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task status to ' || (action->'parameters'->>'value');
                                    
                                WHEN 'priority' THEN
                                    UPDATE tasks 
                                    SET priority = action->'parameters'->>'value',
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task priority to ' || (action->'parameters'->>'value');
                                    
                                WHEN 'assigned_to' THEN
                                    UPDATE tasks 
                                    SET assigned_to = (action->'parameters'->>'value')::uuid,
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task assignee to ' || (action->'parameters'->>'value');
                                    
                                WHEN 'title' THEN
                                    UPDATE tasks 
                                    SET title = action->'parameters'->>'value',
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task title to ' || (action->'parameters'->>'value');
                                    
                                WHEN 'description' THEN
                                    UPDATE tasks 
                                    SET description = action->'parameters'->>'value',
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task description';
                                    
                                WHEN 'due_date' THEN
                                    UPDATE tasks 
                                    SET due_date = (action->'parameters'->>'value')::timestamp with time zone,
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task due date to ' || (action->'parameters'->>'value');
                                    
                                WHEN 'assigned_by' THEN
                                    UPDATE tasks 
                                    SET assigned_by = (action->'parameters'->>'value')::uuid,
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task assigned_by to ' || (action->'parameters'->>'value');
                                    
                                WHEN 'team_id' THEN
                                    UPDATE tasks 
                                    SET team_id = (action->'parameters'->>'value')::uuid,
                                        updated_at = now()
                                    WHERE id = NEW.id;
                                    action_result := 'Updated task team to ' || (action->'parameters'->>'value');
                                    
                                ELSE
                                    action_result := 'Unknown field: ' || (action->'parameters'->>'field');
                            END CASE;
                        END IF;
                        
                    WHEN 'create_task_comment' THEN
                        -- Create a system comment on the task
                        IF TG_TABLE_NAME = 'tasks' THEN
                            INSERT INTO task_comments (
                                task_id,
                                user_id,
                                comment_text,
                                is_system_comment
                            ) VALUES (
                                target_record_id,
                                COALESCE(auth.uid(), (SELECT id FROM profiles WHERE school_id = current_school_id LIMIT 1)),
                                COALESCE(action->'parameters'->>'comment', 'Business rule "' || rule.name || '" was triggered'),
                                true
                            );
                            action_result := 'Created system comment: ' || COALESCE(action->'parameters'->>'comment', 'Business rule triggered');
                        END IF;
                        
                    WHEN 'assign_task' THEN
                        -- Assign task to a specific user
                        IF TG_TABLE_NAME = 'tasks' AND TG_OP != 'DELETE' THEN
                            UPDATE tasks 
                            SET assigned_to = (action->'parameters'->>'user_id')::uuid,
                                updated_at = now()
                            WHERE id = NEW.id;
                            action_result := 'Assigned task to user ' || (action->'parameters'->>'user_id');
                        END IF;
                        
                    WHEN 'log_message' THEN
                        -- Just log a message
                        action_result := COALESCE(action->'parameters'->>'message', 'Business rule executed');
                        RAISE NOTICE 'Business rule "%": %', rule.name, action_result;
                        
                    ELSE
                        -- Unknown action type
                        action_result := 'Unknown action type: ' || (action->>'type');
                        RAISE NOTICE '%', action_result;
                END CASE;
                
                -- Calculate execution time
                end_time := clock_timestamp();
                execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
                
                -- Get after values if we modified the record
                after_values := NULL;
                IF TG_OP != 'DELETE' AND TG_TABLE_NAME = 'tasks' THEN
                    SELECT to_jsonb(t.*) INTO after_values 
                    FROM tasks t 
                    WHERE t.id = target_record_id;
                END IF;
                
                -- Update the log with success and timing
                IF log_id IS NOT NULL THEN
                    UPDATE public.business_rule_logs 
                    SET 
                        success = true,
                        after_values = after_values,
                        execution_time_ms = execution_time,
                        error_message = action_result
                    WHERE id = log_id;
                END IF;
                
            EXCEPTION WHEN OTHERS THEN
                -- Calculate execution time even on error
                end_time := clock_timestamp();
                execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
                
                -- Log the error
                IF log_id IS NOT NULL THEN
                    UPDATE public.business_rule_logs 
                    SET 
                        success = false,
                        error_message = SQLERRM,
                        execution_time_ms = execution_time
                    WHERE id = log_id;
                END IF;
                
                -- Log the error but don't fail the entire transaction
                RAISE NOTICE 'Business rule action failed: %', SQLERRM;
            END;
        END LOOP;
        
        -- Update the rule's last executed timestamp
        UPDATE business_rules 
        SET last_executed = NOW() 
        WHERE id = rule.id;
        
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for tasks table
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
