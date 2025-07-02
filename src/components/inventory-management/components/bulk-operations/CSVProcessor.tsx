import { inventoryItemSchema } from '../../schemas/inventoryItemSchema';

export interface ParsedItem {
  data: any;
  errors: string[];
  isValid: boolean;
  rowNumber: number;
}

export interface FieldMapping {
  csvColumn: string;
  dbField: string | null;
}

export class CSVProcessor {
  private static headerMapping: Record<string, string> = {
    'item_id': 'item_id',
    'itemid': 'item_id',
    'id': 'item_id',
    'item id': 'item_id',
    'item': 'item',
    'item name': 'item',
    'name': 'item',
    'category': 'category',
    'sub_category': 'sub_category',
    'subcategory': 'sub_category',
    'sub category': 'sub_category',
    'size': 'size',
    'gender': 'gender',
    'qty_total': 'qty_total',
    'quantity total': 'qty_total',
    'total quantity': 'qty_total',
    'total qty': 'qty_total',
    'qty total': 'qty_total',
    'qty_issued': 'qty_issued',
    'quantity issued': 'qty_issued',
    'issued quantity': 'qty_issued',
    'issued qty': 'qty_issued',
    'qty issued': 'qty_issued',
    'stock_number': 'stock_number',
    'stock number': 'stock_number',
    'stock': 'stock_number',
    'unit_of_measure': 'unit_of_measure',
    'unit of measure': 'unit_of_measure',
    'unit': 'unit_of_measure',
    'uom': 'unit_of_measure',
    'has_serial_number': 'has_serial_number',
    'has serial number': 'has_serial_number',
    'serial': 'has_serial_number',
    'model_number': 'model_number',
    'model number': 'model_number',
    'model': 'model_number',
    'returnable': 'returnable',
    'accountable': 'accountable',
    'description': 'description',
    'condition': 'condition',
    'location': 'location',
    'notes': 'notes',
    'pending_updates': 'pending_updates',
    'pending updates': 'pending_updates',
    'pending_issue_changes': 'pending_issue_changes',
    'pending issue changes': 'pending_issue_changes',
    'pending_write_offs': 'pending_write_offs',
    'pending write offs': 'pending_write_offs',
  };

  static async parseCSV(file: File, fieldMappings?: FieldMapping[]): Promise<{ parsedItems: ParsedItem[], unmatchedHeaders: string[], csvHeaders: string[] }> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain headers and at least one data row');
    }

    const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // If no field mappings provided, return headers for mapping
    if (!fieldMappings) {
      return { parsedItems: [], unmatchedHeaders: [], csvHeaders };
    }

    // Create column mapping from provided field mappings
    const columnMapping: Record<number, string> = {};
    const unmatchedHeaders: string[] = [];
    
    csvHeaders.forEach((header, index) => {
      const mapping = fieldMappings.find(m => m.csvColumn === header);
      if (mapping?.dbField) {
        columnMapping[index] = mapping.dbField;
      } else {
        unmatchedHeaders.push(header);
      }
    });

    const parsedItems: ParsedItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < csvHeaders.length || !values.some(v => v)) {
        continue; // Skip empty rows
      }

      const item: any = {};
      
      // Map values based on column mapping
      Object.entries(columnMapping).forEach(([columnIndex, dbField]) => {
        const value = values[parseInt(columnIndex)];
        item[dbField] = this.processFieldValue(dbField, value);
      });

      // Validate the item
      const validation = inventoryItemSchema.safeParse(item);
      const errors: string[] = [];
      
      if (!validation.success) {
        validation.error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
      }

      parsedItems.push({
        data: item,
        errors,
        isValid: validation.success,
        rowNumber: i + 1
      });
    }

    return { parsedItems, unmatchedHeaders, csvHeaders };
  }

  static generateAutoMapping(csvHeaders: string[]): FieldMapping[] {
    return csvHeaders.map(header => {
      const normalizedHeader = header.toLowerCase().trim();
      const dbField = this.headerMapping[normalizedHeader] || null;
      return { csvColumn: header, dbField };
    });
  }

  private static processFieldValue(fieldName: string, value: string): any {
    switch (fieldName) {
      case 'qty_total':
      case 'qty_issued':
      case 'pending_updates':
      case 'pending_issue_changes':
      case 'pending_write_offs':
        return value ? parseInt(value) : 0;
      case 'has_serial_number':
      case 'returnable':
      case 'accountable':
        return value?.toLowerCase() === 'true' || value === '1' || value?.toLowerCase() === 'yes';
      case 'gender':
        return value?.toUpperCase() === 'M' || value?.toUpperCase() === 'F' ? value.toUpperCase() : null;
      case 'unit_of_measure':
        return value?.toUpperCase() === 'EA' || value?.toUpperCase() === 'PR' ? value.toUpperCase() : null;
      default:
        return value || null;
    }
  }

  static generateTemplate(): string {
    const headers = [
      'item_id', 'item', 'category', 'sub_category', 'size', 'gender',
      'qty_total', 'qty_issued', 'stock_number', 'unit_of_measure',
      'has_serial_number', 'model_number', 'returnable', 'accountable',
      'description', 'condition', 'location', 'notes'
    ];

    const sampleData = [
      'ITEM001', 'Uniform Shirt', 'Clothing', 'Shirts', 'M', 'M',
      '50', '10', 'STOCK001', 'EA',
      'false', 'MODEL123', 'true', 'true',
      'Blue dress shirt', 'New', 'Storage Room A', 'Standard issue'
    ];

    return [headers.join(','), sampleData.join(',')].join('\n');
  }
}