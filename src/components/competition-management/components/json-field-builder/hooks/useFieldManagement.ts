import { useState, useEffect } from 'react';
import { JsonField } from '../types';

export const useFieldManagement = (value: Record<string, any>, onChange: (value: Record<string, any>) => void) => {
  const [fields, setFields] = useState<JsonField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<Partial<JsonField>>({
    name: '',
    type: 'number',
    textType: 'short',
    values: [],
    maxValue: 100,
    penalty: false,
    pauseField: false
  });
  const [dropdownValues, setDropdownValues] = useState('');

  // Initialize fields from existing template data
  useEffect(() => {
    if (value?.criteria && Array.isArray(value.criteria) && fields.length === 0) {
      const initialFields: JsonField[] = value.criteria.map((criterion: any, index: number) => ({
        id: (index + 1).toString(),
        name: criterion.name,
        type: criterion.type,
        fieldInfo: criterion.fieldInfo,
        textType: criterion.maxLength > 75 ? 'notes' : 'short',
        values: criterion.options,
        maxValue: criterion.maxValue ?? criterion.maxPoints,
        scaleRanges: criterion.scaleRanges,
        penalty: criterion.penalty || false,
        pauseField: criterion.pauseField || false,
        // Load penalty-specific properties
        penaltyType: criterion.penaltyType,
        pointValue: criterion.pointValue,
        splitFirstValue: criterion.splitFirstValue,
        splitSubsequentValue: criterion.splitSubsequentValue
      }));
      setFields(initialFields);
    }
  }, [value, fields.length]);

  const updateJson = (fieldList: JsonField[]) => {
    const jsonStructure = {
      criteria: fieldList.map(field => ({
        name: field.name,
        type: field.type,
        fieldInfo: field.fieldInfo,
        maxLength: field.type === 'text' ? (field.textType === 'notes' ? 2500 : 75) : undefined,
        maxValue: field.type === 'number' ? field.maxValue : undefined,
        scaleRanges: field.scaleRanges,
        penalty: field.penalty,
        pauseField: field.pauseField,
        // Add penalty-specific properties for penalty fields
        ...(field.type === 'penalty' && {
          penaltyType: field.penaltyType,
          pointValue: field.pointValue,
          splitFirstValue: field.splitFirstValue,
          splitSubsequentValue: field.splitSubsequentValue
        }),
        ...(field.values && {
          options: field.values
        })
      }))
    };
    onChange(jsonStructure);
  };


  const editField = (field: JsonField) => {
    setEditingFieldId(field.id);
    setCurrentField({
      name: field.name,
      type: field.type,
      textType: field.textType,
      fieldInfo: field.fieldInfo,
      maxValue: field.maxValue,
      scaleRanges: field.scaleRanges,
      penalty: field.penalty,
      pauseField: field.pauseField,
      values: field.values,
      // Include penalty-specific properties
      penaltyType: field.penaltyType,
      pointValue: field.pointValue,
      splitFirstValue: field.splitFirstValue,
      splitSubsequentValue: field.splitSubsequentValue
    });
    setDropdownValues(field.values ? field.values.join(', ') : '');
  };

  const cancelEdit = () => {
    setEditingFieldId(null);
    setCurrentField({
      name: '',
      type: 'number',
      textType: 'short',
      values: [],
      maxValue: 100,
      penalty: false,
      pauseField: false
    });
    setDropdownValues('');
  };

  const addField = () => {
    if (!currentField.name) return;
    
    const newField: JsonField = {
      id: editingFieldId || Date.now().toString(),
      name: currentField.name,
      type: currentField.type || 'number',
      textType: currentField.textType || 'short',
      fieldInfo: currentField.fieldInfo,
      maxValue: currentField.maxValue || 100,
      scaleRanges: currentField.scaleRanges,
      penalty: currentField.penalty || false,
      pauseField: currentField.pauseField || false,
      // Include penalty-specific properties for penalty fields
      ...(currentField.type === 'penalty' && {
        penaltyType: currentField.penaltyType,
        pointValue: currentField.pointValue,
        splitFirstValue: currentField.splitFirstValue,
        splitSubsequentValue: currentField.splitSubsequentValue
      }),
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

  const reorderFields = (oldIndex: number, newIndex: number) => {
    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(oldIndex, 1);
    updatedFields.splice(newIndex, 0, movedField);
    
    setFields(updatedFields);
    updateJson(updatedFields);
  };

  return {
    fields,
    editingFieldId,
    currentField,
    dropdownValues,
    setDropdownValues,
    editField,
    cancelEdit,
    addField,
    removeField,
    updateCurrentField,
    reorderFields
  };
};