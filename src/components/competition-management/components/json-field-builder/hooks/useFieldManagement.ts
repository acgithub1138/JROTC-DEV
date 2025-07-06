import { useState, useEffect } from 'react';
import { JsonField } from '../types';

export const useFieldManagement = (value: Record<string, any>, onChange: (value: Record<string, any>) => void) => {
  const [fields, setFields] = useState<JsonField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<Partial<JsonField>>({
    name: '',
    type: 'text',
    textType: 'short',
    values: [],
    maxValue: 100,
    penalty: false
  });
  const [dropdownValues, setDropdownValues] = useState('');

  // Initialize fields from existing template data
  useEffect(() => {
    if (value?.criteria && Array.isArray(value.criteria) && fields.length === 0) {
      const initialFields: JsonField[] = value.criteria.map((criterion: any, index: number) => ({
        id: (index + 1).toString(),
        name: criterion.name,
        type: criterion.type,
        textType: criterion.maxLength > 75 ? 'notes' : 'short',
        values: criterion.options,
        maxValue: criterion.maxValue,
        pointValue: criterion.pointValue,
        penaltyValue: criterion.penaltyValue,
        scaleRanges: criterion.scaleRanges,
        penalty: criterion.penalty || false
      }));
      setFields(initialFields);
    }
  }, [value, fields.length]);

  const updateJson = (fieldList: JsonField[]) => {
    const jsonStructure = {
      criteria: fieldList.map(field => ({
        name: field.name,
        type: field.type,
        maxLength: field.type === 'text' ? (field.textType === 'notes' ? 2500 : 75) : undefined,
        maxValue: field.type === 'number' ? field.maxValue : undefined,
        pointValue: field.pointValue,
        penaltyValue: field.penaltyValue,
        scaleRanges: field.scaleRanges,
        penalty: field.penalty,
        ...(field.values && {
          options: field.values
        })
      }))
    };
    onChange(jsonStructure);
  };

  const loadPreset = (presetFields: JsonField[]) => {
    setFields(presetFields);
    updateJson(presetFields);
  };

  const editField = (field: JsonField) => {
    setEditingFieldId(field.id);
    setCurrentField({
      name: field.name,
      type: field.type,
      textType: field.textType,
      maxValue: field.maxValue,
      pointValue: field.pointValue,
      penaltyValue: field.penaltyValue,
      scaleRanges: field.scaleRanges,
      penalty: field.penalty,
      values: field.values
    });
    setDropdownValues(field.values ? field.values.join(', ') : '');
  };

  const cancelEdit = () => {
    setEditingFieldId(null);
    setCurrentField({
      name: '',
      type: 'text',
      textType: 'short',
      values: [],
      maxValue: 100,
      penalty: false
    });
    setDropdownValues('');
  };

  const addField = () => {
    if (!currentField.name) return;
    
    const newField: JsonField = {
      id: editingFieldId || Date.now().toString(),
      name: currentField.name,
      type: currentField.type || 'text',
      textType: currentField.textType || 'short',
      maxValue: currentField.maxValue || 100,
      pointValue: currentField.pointValue,
      penaltyValue: currentField.penaltyValue,
      scaleRanges: currentField.scaleRanges,
      penalty: currentField.penalty || false,
      ...(currentField.type === 'dropdown' && {
        values: dropdownValues.split(',').map(v => v.trim()).filter(v => v)
      })
    };
    
    let updatedFields;
    if (editingFieldId) {
      // Update existing field
      updatedFields = fields.map(f => f.id === editingFieldId ? newField : f);
    } else {
      // Add new field
      updatedFields = [...fields, newField];
    }
    
    setFields(updatedFields);
    updateJson(updatedFields);
    cancelEdit();
  };

  const removeField = (id: string) => {
    const updatedFields = fields.filter(f => f.id !== id);
    setFields(updatedFields);
    updateJson(updatedFields);
  };

  const updateCurrentField = (key: keyof JsonField, value: any) => {
    setCurrentField(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    fields,
    editingFieldId,
    currentField,
    dropdownValues,
    setDropdownValues,
    loadPreset,
    editField,
    cancelEdit,
    addField,
    removeField,
    updateCurrentField
  };
};