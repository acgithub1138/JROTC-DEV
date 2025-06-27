
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface SchemaField {
  id: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default?: string;
  is_active: boolean;
}

export const useSchemaTracking = () => {
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchemaData = async () => {
    try {
      const { data, error } = await supabase
        .from('schema_tracking')
        .select('*')
        .eq('is_active', true)
        .order('table_name')
        .order('column_name');

      if (error) throw error;
      
      setFields(data || []);
      
      // Extract unique table names
      const uniqueTables = [...new Set(data?.map(field => field.table_name) || [])];
      setTables(uniqueTables);
    } catch (error) {
      console.error('Error fetching schema data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schema information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldsForTable = (tableName: string) => {
    return fields.filter(field => field.table_name === tableName);
  };

  const getProfileFields = () => {
    return fields.filter(field => 
      field.table_name === 'profiles' && 
      field.data_type === 'text' && 
      ['email', 'first_name', 'last_name'].includes(field.column_name)
    );
  };

  useEffect(() => {
    fetchSchemaData();
  }, []);

  return {
    fields,
    tables,
    loading,
    getFieldsForTable,
    getProfileFields,
    refetch: fetchSchemaData,
  };
};
