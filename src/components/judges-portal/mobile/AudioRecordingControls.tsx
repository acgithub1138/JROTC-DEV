import { Button } from '@/components/ui/button';
import { Mic, Pause } from 'lucide-react';
import type { AudioMode, RecordingState } from '@/hooks/useAudioRecording';
interface AudioRecordingControlsProps {
  mode: AudioMode;
  recordingState: RecordingState;
  duration: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
}
export const AudioRecordingControls = ({
  mode,
  recordingState,
  duration,
  onStart,
  onPause,
  onResume
}: AudioRecordingControlsProps) => {
  if (mode === 'none') {
    return null;
  }
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const isRecording = recordingState === 'recording';
  const isPaused = recordingState === 'paused';
  return <div className="flex flex-col items-center justify-center gap-2">
      <Button type="button" variant={isRecording ? "destructive" : "default"} size="lg" onClick={() => {
      console.log('AudioRecordingControls click', {
        mode,
        recordingState
      });
      if (isRecording) {
        console.log('Pausing recording');
        onPause();
      } else if (isPaused) {
        console.log('Resuming recording');
        onResume();
      } else {
        console.log('Starting recording');
        onStart();
      }
    }} aria-label={isRecording ? 'Pause recording' : isPaused ? 'Resume recording' : 'Start recording'} aria-pressed={isRecording} className="w-16 h-16 rounded-full p-0 py-[8px]">

        {isRecording ? <Pause className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>
      <div className="flex items-center gap-2">
        {isRecording && <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />}
        <span className="text-xs font-medium tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>
    </div>;
};