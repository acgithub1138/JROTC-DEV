interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressIndicator = ({ current, total, label = "Question" }: ProgressIndicatorProps) => {
  return (
    <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-10">
      {label} {current} of {total}
    </div>
  );
};
