
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
} from '@dnd-kit/sortable';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem, useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useToast } from '@/hooks/use-toast';
import { SortableItem } from './SortableItem';

interface SidebarCustomizationDialogProps {
  onOpenChange: (open: boolean) => void;
  onPreferencesUpdated?: () => void;
}

export const SidebarCustomizationDialog: React.FC<SidebarCustomizationDialogProps> = ({
  onOpenChange,
  onPreferencesUpdated,
}) => {
  const { menuItems, savePreferences, resetToDefault, getDefaultMenuItems } = useSidebarPreferences();
  const [localItems, setLocalItems] = useState<MenuItem[]>([...menuItems]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    setLocalItems([...menuItems]);
  }, [menuItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          console.error('Could not find items for drag operation', { active: active.id, over: over.id });
          return items;
        }

        console.log('Moving item from index', oldIndex, 'to index', newIndex);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log('Saving sidebar preferences with items:', localItems);
    
    try {
      const success = await savePreferences(localItems);
      
      if (success) {
        toast({
          title: "Saved",
          description: "Your sidebar preferences have been saved.",
        });
        onOpenChange(false);
        if (onPreferencesUpdated) {
          onPreferencesUpdated();
        }
      } else {
        console.error('Save preferences returned false');
        toast({
          title: "Error",
          description: "Failed to save sidebar preferences. Please check the console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Exception in handleSave:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving preferences.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    setIsSaving(true);
    const success = await resetToDefault();
    
    if (success) {
      setLocalItems([...getDefaultMenuItems]);
      toast({
        title: "Reset",
        description: "Sidebar has been reset to default layout.",
      });
      onOpenChange(false);
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
  );
};
