
export interface EditState {
  field: string | null;
  value: any;
}

export interface TaskDetailProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: any) => void;
}
