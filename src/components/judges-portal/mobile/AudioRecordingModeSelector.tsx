import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AudioMode } from '@/hooks/useAudioRecording';

interface AudioRecordingModeSelectorProps {
  selectedMode: AudioMode;
  onModeChange: (mode: AudioMode) => void;
}

export const AudioRecordingModeSelector = ({
  selectedMode,
  onModeChange
}: AudioRecordingModeSelectorProps) => {
  const modes: { value: AudioMode; label: string; description: string }[] = [
    { 
      value: 'none', 
      label: 'None',
      description: 'No recording will be made'
    },
    { 
      value: 'manual', 
      label: 'Manual',
      description: 'Recording will start when you tap the start button, you will be able to pause & start recording during judging'
    },
    { 
      value: 'auto', 
      label: 'Auto',
      description: 'Recording will start automatically when you click >, you will be able to pause & start recording during judging'
    }
  ];

  return (
    <div className="mt-8 max-w-md mx-auto w-full">
      <h2 className="text-lg font-semibold mb-3 text-center">Audio Recording</h2>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => (
          <Button
            key={mode.value}
            type="button"
            variant={selectedMode === mode.value ? "default" : "outline"}
            onClick={() => onModeChange(mode.value)}
            className={cn(
              "h-14 text-base font-semibold touch-manipulation",
              selectedMode === mode.value && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {mode.label}
          </Button>
        ))}
      </div>
      
      {selectedMode && (
        <p className="mt-4 text-sm text-muted-foreground text-center px-4">
          {modes.find(mode => mode.value === selectedMode)?.description}
        </p>
      )}
    </div>
  );
};
