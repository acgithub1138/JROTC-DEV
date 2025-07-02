import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ParsedItem {
  data: any;
  errors: string[];
  isValid: boolean;
  rowNumber: number;
}

interface DataPreviewTableProps {
  parsedData: ParsedItem[];
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  parsedData,
}) => {
  return (
    <ScrollArea className="h-96 border rounded-lg">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">Row</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-20">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Item ID</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Item</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Sub Category</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stock Number</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Errors</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {parsedData.map((item, index) => (
              <tr key={index} className={`border-b transition-colors hover:bg-muted/50 ${!item.isValid ? 'bg-red-50' : ''}`}>
                <td className="p-4 align-middle">{item.rowNumber}</td>
                <td className="p-4 align-middle">
                  {item.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </td>
                <td className="p-4 align-middle">{item.data.item_id || 'N/A'}</td>
                <td className="p-4 align-middle font-medium">{item.data.item || 'N/A'}</td>
                <td className="p-4 align-middle">{item.data.category || 'N/A'}</td>
                <td className="p-4 align-middle">{item.data.sub_category || 'N/A'}</td>
                <td className="p-4 align-middle">{item.data.stock_number || 'N/A'}</td>
                <td className="p-4 align-middle">
                  {item.errors.length > 0 && (
                    <div className="text-xs text-red-600 space-y-1">
                      {item.errors.map((error, idx) => (
                        <div key={idx}>{error}</div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
};