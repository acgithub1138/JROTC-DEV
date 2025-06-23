import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem, useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';

interface SortableItemProps {
  item: MenuItem;
}

const SortableItem: React.FC<SortableItemProps> = ({ item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = (Icons as any)[item.icon];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      {IconComponent && <IconComponent className="w-4 h-4" />}
      <span className="flex-1">{item.label}</span>
    </div>
  );
};

interface SidebarCustomizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreferencesUpdated?: () => void;
}

export const SidebarCustomization: React.FC<SidebarCustomizationProps> = ({
  open,
  onOpenChange,
  onPreferencesUpdated,
}) => {
  const { menuItems, savePreferences, resetToDefault, getDefaultMenuItems } = useSidebarPreferences();
  const [localItems, setLocalItems] = useState<MenuItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    if (open) {
      setLocalItems([...menuItems]);
    }
  }, [open, menuItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await savePreferences(localItems);
    
    if (success) {
      toast({
        title: "Saved",
        description: "Your sidebar preferences have been saved.",
      });
      onOpenChange(false);
      // Trigger sidebar refresh
      if (onPreferencesUpdated) {
        onPreferencesUpdated();
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to save sidebar preferences.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    setIsSaving(true);
    const success = await resetToDefault();
    
    if (success) {
      setLocalItems([...getDefaultMenuItems()]);
      toast({
        title: "Reset",
        description: "Sidebar has been reset to default layout.",
      });
      onOpenChange(false);
      // Trigger sidebar refresh
      if (onPreferencesUpdated) {
        onPreferencesUpdated();
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to reset sidebar preferences.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Customize Sidebar</DialogTitle>
          <DialogDescription>
            Drag and drop to reorder your sidebar menu items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={localItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              {localItems.map((item) => (
                <SortableItem key={item.id} item={item} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
