import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, ChevronRight, Eye } from 'lucide-react';
interface JsonField {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'number' | 'scoring_scale' | 'section_header' | 'penalty_checkbox' | 'calculated';
  textType?: 'short' | 'notes'; // For text fields
  values?: string[];
  maxValue?: number; // For number fields
  pointValue?: number; // Point value for this field
  penalty: boolean;
  penaltyValue?: number; // Specific penalty amount
  // Scoring scale specific
  scaleRanges?: {
    poor: { min: number; max: number };
    average: { min: number; max: number };
    exceptional: { min: number; max: number };
  };
  // Section specific
  sectionId?: string;
  // Calculated field specific
  calculationType?: 'sum' | 'subtotal';
  calculationFields?: string[];
}
interface JsonFieldBuilderProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}
export const JsonFieldBuilder: React.FC<JsonFieldBuilderProps> = ({
  value,
  onChange
}) => {
  const [fields, setFields] = useState<JsonField[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<JsonField>>({
    name: '',
    type: 'text',
    textType: 'short',
    values: [],
    maxValue: 100,
    penalty: false
  });
  const [dropdownValues, setDropdownValues] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const loadPreset = (presetName: string) => {
    const presets: Record<string, JsonField[]> = {
      'air_force_inspection': [
        { id: '1', name: 'Unit & Commander Overall', type: 'section_header', penalty: false },
        { id: '2', name: 'Overall Appearance and Bearing', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '3', name: 'Knowledge of Drill and Ceremony', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '4', name: 'Knowledge of AFJROTC', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '5', name: 'Leadership Response', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '6', name: 'Individual Inspections', type: 'section_header', penalty: false },
        { id: '7', name: 'Overall Appearance and Bearing', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '8', name: 'Knowledge of Drill and Ceremony', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '9', name: 'Knowledge of AFJROTC', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '10', name: 'Leadership Response', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
        { id: '11', name: 'Gig Line', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
        { id: '12', name: 'Hair/Cosmetic Grooming', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
        { id: '13', name: 'Shoes Unshined', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
        { id: '14', name: 'Pants Unfit/Improper', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
        { id: '15', name: 'Shirt Unfit/Improper', type: 'penalty_checkbox', penaltyValue: 1, penalty: true }
      ]
    };
    
    const preset = presets[presetName];
    if (preset) {
      setFields(preset);
      updateJson(preset);
    }
  };
  const addField = () => {
    if (!currentField.name) return;
    const newField: JsonField = {
      id: Date.now().toString(),
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
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    updateJson(updatedFields);

    // Reset form
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
  const removeField = (id: string) => {
    const updatedFields = fields.filter(f => f.id !== id);
    setFields(updatedFields);
    updateJson(updatedFields);
  };
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
  const updateCurrentField = (key: keyof JsonField, value: any) => {
    setCurrentField(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const jsonPreview = JSON.stringify(value, null, 2);
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Score Sheet Builder</CardTitle>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => loadPreset('air_force_inspection')}>
              Load Air Force Preset
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name *</Label>
              <Input id="fieldName" value={currentField.name || ''} onChange={e => updateCurrentField('name', e.target.value)} placeholder="e.g., Overall Appearance" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <Select value={currentField.type} onValueChange={value => updateCurrentField('type', value as JsonField['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="section_header">Section Header</SelectItem>
                  <SelectItem value="scoring_scale">Scoring Scale (Poor/Average/Exceptional)</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="penalty_checkbox">Penalty Checkbox</SelectItem>
                  <SelectItem value="calculated">Calculated Field</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentField.type === 'text' && <div className="space-y-2">
                <Label htmlFor="textType">Text Field Type</Label>
                <Select value={currentField.textType} onValueChange={value => updateCurrentField('textType', value as 'short' | 'notes')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short Text (75 chars)</SelectItem>
                    <SelectItem value="notes">Notes (2500 chars)</SelectItem>
                  </SelectContent>
                </Select>
              </div>}

            {currentField.type === 'dropdown' && <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dropdownValues">Dropdown Values (comma-separated)</Label>
                <Input id="dropdownValues" value={dropdownValues} onChange={e => setDropdownValues(e.target.value)} placeholder="e.g., Excellent, Good, Fair, Poor" />
              </div>}

            {currentField.type === 'number' && <div className="space-y-2">
                <Label htmlFor="maxValue">Max Value</Label>
                <Input id="maxValue" type="number" value={currentField.maxValue || 100} onChange={e => updateCurrentField('maxValue', parseInt(e.target.value))} />
              </div>}

            {currentField.type === 'scoring_scale' && <div className="space-y-4 md:col-span-2">
                <Label>Scoring Scale Ranges</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Poor Range</Label>
                    <div className="flex gap-1">
                      <Input type="number" placeholder="Min" value={currentField.scaleRanges?.poor?.min || 1} onChange={e => updateCurrentField('scaleRanges', {...currentField.scaleRanges, poor: {...currentField.scaleRanges?.poor, min: parseInt(e.target.value) || 1}})} />
                      <Input type="number" placeholder="Max" value={currentField.scaleRanges?.poor?.max || 2} onChange={e => updateCurrentField('scaleRanges', {...currentField.scaleRanges, poor: {...currentField.scaleRanges?.poor, max: parseInt(e.target.value) || 2}})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Average Range</Label>
                    <div className="flex gap-1">
                      <Input type="number" placeholder="Min" value={currentField.scaleRanges?.average?.min || 3} onChange={e => updateCurrentField('scaleRanges', {...currentField.scaleRanges, average: {...currentField.scaleRanges?.average, min: parseInt(e.target.value) || 3}})} />
                      <Input type="number" placeholder="Max" value={currentField.scaleRanges?.average?.max || 8} onChange={e => updateCurrentField('scaleRanges', {...currentField.scaleRanges, average: {...currentField.scaleRanges?.average, max: parseInt(e.target.value) || 8}})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Exceptional Range</Label>
                    <div className="flex gap-1">
                      <Input type="number" placeholder="Min" value={currentField.scaleRanges?.exceptional?.min || 9} onChange={e => updateCurrentField('scaleRanges', {...currentField.scaleRanges, exceptional: {...currentField.scaleRanges?.exceptional, min: parseInt(e.target.value) || 9}})} />
                      <Input type="number" placeholder="Max" value={currentField.scaleRanges?.exceptional?.max || 10} onChange={e => updateCurrentField('scaleRanges', {...currentField.scaleRanges, exceptional: {...currentField.scaleRanges?.exceptional, max: parseInt(e.target.value) || 10}})} />
                    </div>
                  </div>
                </div>
              </div>}

            {currentField.type === 'penalty_checkbox' && <div className="space-y-2">
                <Label htmlFor="penaltyValue">Penalty Value</Label>
                <Input id="penaltyValue" type="number" value={currentField.penaltyValue || 1} onChange={e => updateCurrentField('penaltyValue', parseInt(e.target.value))} placeholder="e.g., 1, 2, 5" />
              </div>}

            {(currentField.type === 'scoring_scale' || currentField.type === 'number' || currentField.type === 'penalty_checkbox') && <div className="space-y-2">
                <Label htmlFor="pointValue">Point Value</Label>
                <Input id="pointValue" type="number" value={currentField.pointValue || 10} onChange={e => updateCurrentField('pointValue', parseInt(e.target.value))} placeholder="e.g., 10, 30" />
              </div>}

            <div className="flex items-center space-x-2">
              <Switch id="penalty" checked={currentField.penalty || false} onCheckedChange={checked => updateCurrentField('penalty', checked)} />
              <Label htmlFor="penalty">Penalty Field</Label>
            </div>
          </div>

          <Button onClick={addField} className="w-full" disabled={!currentField.name}>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </CardContent>
      </Card>

      {fields.length > 0 && <Card>
          <CardHeader>
            <CardTitle>Added Fields ({fields.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.map(field => <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <span className="font-medium">{field.name}</span>
                    <div className="text-sm text-muted-foreground">
                      <span>({field.type.replace('_', ' ')}</span>
                      {field.type === 'text' && `, ${field.textType === 'notes' ? '2500' : '75'} chars`}
                      {field.type === 'number' && `, max: ${field.maxValue}`}
                      {field.type === 'scoring_scale' && field.scaleRanges && `, ${field.scaleRanges.poor.min}-${field.scaleRanges.poor.max}/${field.scaleRanges.average.min}-${field.scaleRanges.average.max}/${field.scaleRanges.exceptional.min}-${field.scaleRanges.exceptional.max}`}
                      {field.type === 'penalty_checkbox' && `, -${field.penaltyValue} pts`}
                      {field.pointValue && `, ${field.pointValue} pts`}
                      {field.penalty && ', penalty'}
                      {field.values && `, ${field.values.length} options`})
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => removeField(field.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>)}
            </div>
          </CardContent>
        </Card>}

{showPreview && fields.length > 0 && <Card>
          <CardHeader>
            <CardTitle>Score Sheet Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 p-6 bg-background">
              <div className="space-y-6">
                {fields.map(field => {
            if (field.type === 'section_header') {
              return <div key={field.id} className="border-b-2 border-primary pb-2">
                      <h3 className="text-lg font-bold text-primary">{field.name}</h3>
                    </div>;
            }
            if (field.type === 'scoring_scale') {
              return <div key={field.id} className="grid grid-cols-5 gap-2 items-center py-2 border-b">
                      <div className="font-medium">{field.name}</div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Poor</div>
                        <div className="text-sm">{field.scaleRanges?.poor.min}-{field.scaleRanges?.poor.max}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Average</div>
                        <div className="text-sm">{field.scaleRanges?.average.min}-{field.scaleRanges?.average.max}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Exceptional</div>
                        <div className="text-sm">{field.scaleRanges?.exceptional.min}-{field.scaleRanges?.exceptional.max}</div>
                      </div>
                      <div className="text-center font-medium">
                        {field.pointValue} pts
                      </div>
                    </div>;
            }
            if (field.type === 'penalty_checkbox') {
              return <div key={field.id} className="flex items-center justify-between py-1 border-b border-dashed">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" disabled className="w-4 h-4" />
                        <span className="text-sm">{field.name}</span>
                      </div>
                      <span className="text-sm text-destructive">-{field.penaltyValue} pts</span>
                    </div>;
            }
            return <div key={field.id} className="flex items-center justify-between py-2 border-b">
                    <span className="font-medium">{field.name}</span>
                    <div className="flex items-center gap-2">
                      <input className="border rounded px-2 py-1 w-32" disabled />
                      {field.pointValue && <span className="text-sm">{field.pointValue} pts</span>}
                    </div>
                  </div>;
          })}
              </div>
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>JSON Preview</span>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <Textarea value={jsonPreview} readOnly className="font-mono text-sm min-h-[200px]" />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    </div>;
};