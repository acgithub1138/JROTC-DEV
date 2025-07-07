import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { JsonField } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FieldListProps {
  fields: JsonField[];
  onEditField: (field: JsonField) => void;
  onRemoveField: (id: string) => void;
  onReorderFields: (oldIndex: number, newIndex: number) => void;
}

interface SortableFieldItemProps {
  field: JsonField;
  onEditField: (field: JsonField) => void;
  onRemoveField: (id: string) => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({ field, onEditField, onRemoveField }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      data-field-id={field.id}
      className="flex items-center gap-2 p-2 border rounded bg-background"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <span className="font-medium">{field.name}</span>
        <div className="text-sm text-muted-foreground">
          <span>({field.type.replace('_', ' ')}</span>
          {field.type === 'text' && `, ${field.textType === 'notes' ? '2500' : '75'} chars`}
          {field.type === 'number' && `, max: ${field.maxValue}`}
          {field.penalty && ', penalty'}
          {field.pauseField && ', pause'}
          {field.values && `, ${field.values.length} options`})
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onEditField(field)}>
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onRemoveField(field.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const FieldList: React.FC<FieldListProps> = ({ fields, onEditField, onRemoveField, onReorderFields }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);
      onReorderFields(oldIndex, newIndex);
    }
  };

  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Added Fields ({fields.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={fields.map(field => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map(field => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  onEditField={onEditField}
                  onRemoveField={onRemoveField}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};