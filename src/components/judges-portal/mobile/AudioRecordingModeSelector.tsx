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
  const modes: { value: AudioMode; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'manual', label: 'Manual' },
    { value: 'auto', label: 'Auto' }
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
    </div>
  );
};
