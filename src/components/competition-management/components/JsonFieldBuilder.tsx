import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { JsonFieldBuilderProps } from './json-field-builder/types';
import { useFieldManagement } from './json-field-builder/hooks/useFieldManagement';
import { FieldForm } from './json-field-builder/components/FieldForm';
import { FieldList } from './json-field-builder/components/FieldList';
import { ScoreSheetPreview } from './json-field-builder/components/ScoreSheetPreview';
import { JsonPreview } from './json-field-builder/components/JsonPreview';

export const JsonFieldBuilder: React.FC<JsonFieldBuilderProps> = ({
  value,
  onChange
}) => {
  const { userProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Refs for scroll behavior
  const formSectionRef = useRef<HTMLDivElement>(null);
  const fieldListRef = useRef<HTMLDivElement>(null);

  const {
    fields,
    editingFieldId,
    currentField,
    dropdownValues,
    setDropdownValues,
    editField: originalEditField,
    cancelEdit,
    addField: originalAddField,
    removeField,
    updateCurrentField
  } = useFieldManagement(value, onChange);

  // Enhanced editField that scrolls to form section
  const editField = useCallback((field: any) => {
    originalEditField(field);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }, [originalEditField]);

  // Enhanced addField that scrolls back to the edited field
  const addField = useCallback(() => {
    const wasEditing = editingFieldId;
    originalAddField();
    
    if (wasEditing) {
      setTimeout(() => {
        const fieldElement = document.querySelector(`[data-field-id="${wasEditing}"]`);
        if (fieldElement) {
          fieldElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 200);
    }
  }, [originalAddField, editingFieldId]);

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="space-y-6">
      <Card ref={formSectionRef}>
        <CardHeader>
          <CardTitle>Score Sheet Builder</CardTitle>
          <div className="flex gap-2 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <FieldForm
            currentField={currentField}
            dropdownValues={dropdownValues}
            editingFieldId={editingFieldId}
            onFieldUpdate={updateCurrentField}
            onDropdownValuesChange={setDropdownValues}
            onAddField={addField}
            onCancelEdit={cancelEdit}
          />
        </CardContent>
      </Card>

      <FieldList
        fields={fields}
        onEditField={editField}
        onRemoveField={removeField}
      />

      <ScoreSheetPreview
        fields={fields}
        show={showPreview}
      />

      <JsonPreview
        value={value}
        isExpanded={isExpanded}
        onToggleExpanded={setIsExpanded}
      />
    </div>
  );
};