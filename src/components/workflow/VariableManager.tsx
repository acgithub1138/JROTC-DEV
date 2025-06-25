import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  description?: string;
}

interface VariableManagerProps {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({
  variables,
  onVariablesChange
}) => {
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addVariable = () => {
    setEditingVariable({
      name: '',
      type: 'string',
      value: '',
      description: ''
    });
    setIsDialogOpen(true);
  };

  const editVariable = (variable: Variable) => {
    setEditingVariable({ ...variable });
    setIsDialogOpen(true);
  };

  const saveVariable = () => {
    if (!editingVariable?.name) return;

    const existingIndex = variables.findIndex(v => v.name === editingVariable.name);
    let newVariables = [...variables];

    if (existingIndex >= 0) {
      newVariables[existingIndex] = editingVariable;
    } else {
      newVariables.push(editingVariable);
    }

    onVariablesChange(newVariables);
    setEditingVariable(null);
    setIsDialogOpen(false);
  };

  const deleteVariable = (name: string) => {
    onVariablesChange(variables.filter(v => v.name !== name));
  };

  const formatValue = (value: any, type: string) => {
    if (type === 'object' || type === 'array') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Workflow Variables
          <Button onClick={addVariable} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Variable
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {variables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No variables defined
          </div>
        ) : (
          <div className="space-y-2">
            {variables.map((variable) => (
              <div key={variable.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{variable.name}</div>
                  <div className="text-sm text-gray-500">
                    {variable.type} • {formatValue(variable.value, variable.type)}
                  </div>
                  {variable.description && (
                    <div className="text-xs text-gray-400 mt-1">{variable.description}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => editVariable(variable)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteVariable(variable.name)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVariable?.name ? 'Edit Variable' : 'Add Variable'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Variable Name</Label>
                <Input
                  id="name"
                  value={editingVariable?.name || ''}
                  onChange={(e) => setEditingVariable(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="variableName"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={editingVariable?.type} onValueChange={(value: Variable['type']) => 
                  setEditingVariable(prev => prev ? { ...prev, type: value } : null)
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Value</Label>
                {editingVariable?.type === 'object' || editingVariable?.type === 'array' ? (
                  <Textarea
                    id="value"
                    value={formatValue(editingVariable?.value, editingVariable?.type)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditingVariable(prev => prev ? { ...prev, value: parsed } : null);
                      } catch {
                        // Keep the text value for editing
                      }
                    }}
                    placeholder={editingVariable?.type === 'object' ? '{"key": "value"}' : '["item1", "item2"]'}
                    rows={4}
                  />
                ) : (
                  <Input
                    id="value"
                    value={editingVariable?.value || ''}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (editingVariable?.type === 'number') {
                        value = parseFloat(value) || 0;
                      } else if (editingVariable?.type === 'boolean') {
                        value = value === 'true';
                      }
                      setEditingVariable(prev => prev ? { ...prev, value } : null);
                    }}
                    placeholder={
                      editingVariable?.type === 'boolean' ? 'true/false' :
                      editingVariable?.type === 'number' ? '123' : 'value'
                    }
                  />
                )}
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={editingVariable?.description || ''}
                  onChange={(e) => setEditingVariable(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Description of this variable"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveVariable}>
                  Save Variable
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
