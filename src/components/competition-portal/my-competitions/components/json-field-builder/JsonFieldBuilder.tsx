import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { FieldForm } from './components/FieldForm';
import { FieldList } from './components/FieldList';
import { ScoreSheetPreview } from './components/ScoreSheetPreview';
import { JsonPreview } from './components/JsonPreview';
import { useFieldManagement } from './hooks/useFieldManagement';
import { JsonFieldBuilderProps } from './types';

export const JsonFieldBuilder: React.FC<JsonFieldBuilderProps> = ({ value, onChange }) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const {
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
  } = useFieldManagement(value, onChange);

  // Enhanced handlers that include scrolling behavior
  const editFieldWithScroll = useCallback((field: any) => {
    editField(field);
    
    // Scroll to the form section after a short delay
    setTimeout(() => {
      const formSection = document.querySelector('[data-form-section]');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [editField]);

  const addFieldWithScroll = useCallback(() => {
    addField();
    
    // Scroll to the newly added or edited field
    setTimeout(() => {
      const targetElement = editingFieldId 
        ? document.querySelector(`[data-field-id="${editingFieldId}"]`)
        : document.querySelectorAll('[data-field-id]')[document.querySelectorAll('[data-field-id]').length - 1];
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [addField, editingFieldId]);

  return (
    <div className="space-y-6">
      <Card data-form-section>
        <CardHeader>
          <CardTitle>Add Score Sheet Field</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldForm
            currentField={currentField}
            dropdownValues={dropdownValues}
            editingFieldId={editingFieldId}
            onFieldUpdate={updateCurrentField}
            onDropdownValuesChange={setDropdownValues}
            onAddField={addFieldWithScroll}
            onCancelEdit={cancelEdit}
          />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      <FieldList
        fields={fields}
        onEditField={editFieldWithScroll}
        onRemoveField={removeField}
        onReorderFields={reorderFields}
      />

      <ScoreSheetPreview fields={fields} show={showPreview} />

      <JsonPreview 
        value={value}
        isExpanded={isPreviewExpanded}
        onToggleExpanded={setIsPreviewExpanded}
      />
    </div>
  );
};