import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, RotateCw, Square, Trash2, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AudioPlaybackControlsProps {
  audioBlob: Blob | null;
  isRecording: boolean;
  onContinueRecording: () => void;
  onPauseRecording: () => void;
  onDelete: () => void;
}

export const AudioPlaybackControls = ({
  audioBlob,
  isRecording,
  onContinueRecording,
  onPauseRecording,
  onDelete
}: AudioPlaybackControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (audioBlob) {
      // Revoke old URL if it exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      // Create new URL
      audioUrlRef.current = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrlRef.current;
      }
    }

    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [audioBlob]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleRewind = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const handleFastForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      audioRef.current.duration,
      audioRef.current.currentTime + 10
    );
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    handleStop();
    onDelete();
    setShowPlayback(false);
    setShowDeleteDialog(false);
  };

  if (!audioBlob) {
    return null;
  }

  return (
    <>
      <Card className="p-4 mt-6">
        <h3 className="font-semibold mb-4">Audio Recording</h3>
        
        {/* Main Controls */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPlayback(!showPlayback)}
            className="h-12"
          >
            {showPlayback ? (
              <ChevronUp className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            Replay
          </Button>
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? onPauseRecording : onContinueRecording}
            className="h-12"
          >
            {isRecording ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            {isRecording ? 'Pause' : 'Continue'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            className="h-12 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Playback Controls */}
        {showPlayback && (
          <div className="grid grid-cols-4 gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePlayPause}
              className="h-12"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRewind}
              className="h-12"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleFastForward}
              className="h-12"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleStop}
              className="h-12"
            >
              <Square className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audio recording? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
