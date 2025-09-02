import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BudgetTransaction } from '../BudgetManagementPage';

export const useExportBudgetTransactions = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    if (!userProfile?.school_id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Fetch non-archived Income and Expense records
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .eq('active', true)
        .eq('archive', false)
        .in('category', ['income', 'expense'])
        .order('date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No non-archived budget transactions found to export.',
        });
        return;
      }

      // Format data for Excel
      const formattedData = data.map((transaction: BudgetTransaction) => ({
        'Date': new Date(transaction.date).toLocaleDateString(),
        'Category': transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1),
        'Type': transaction.type,
        'Item': transaction.item,
        'Description': transaction.description || '',
        'Amount': transaction.amount,
        'Payment Method': transaction.payment_method ? 
          transaction.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
        'Status': transaction.status ? 
          transaction.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
        'Budget Year': transaction.budget_year || '',
        'Created At': new Date(transaction.created_at).toLocaleString(),
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Auto-size columns
      const colWidths = Object.keys(formattedData[0] || {}).map(key => {
        const maxLength = Math.max(
          key.length,
          ...formattedData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Transactions');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Budget_Transactions_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      toast({
        title: 'Export Successful',
        description: `Exported ${data.length} transactions to ${filename}`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export budget transactions.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToExcel,
    isExporting,
  };
};