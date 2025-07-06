import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { JsonFieldBuilderProps } from './json-field-builder/types';
import { useFieldManagement } from './json-field-builder/hooks/useFieldManagement';
import { getPresetByKey } from './json-field-builder/presets';
import { PresetSelector } from './json-field-builder/components/PresetSelector';
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

  const {
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
  } = useFieldManagement(value, onChange);

  const handlePresetSelect = (presetKey: string) => {
    const preset = getPresetByKey(presetKey);
    if (preset) {
      loadPreset(preset.fields);
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Score Sheet Builder</CardTitle>
          <div className="flex gap-2 mt-2">
            {isAdmin && <PresetSelector onPresetSelect={handlePresetSelect} />}
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