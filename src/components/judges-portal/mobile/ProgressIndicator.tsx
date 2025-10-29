interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  position?: 'top-right' | 'bottom-center';
}

export const ProgressIndicator = ({ 
  current, 
  total, 
  label = "Question",
  position = 'top-right' 
}: ProgressIndicatorProps) => {
  const positionClasses = position === 'bottom-center' 
    ? 'fixed bottom-20 left-1/2 -translate-x-1/2'
    : 'fixed top-4 right-4';
    
  return (
    <div className={`${positionClasses} bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-10`}>
      {label ? `${label} ` : ''}{current} of {total}
    </div>
  );
};
