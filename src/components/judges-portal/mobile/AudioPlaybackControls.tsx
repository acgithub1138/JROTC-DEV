import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Trash2, Mic } from "lucide-react";
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
import type { RecordingState } from "@/hooks/useAudioRecording";

interface AudioPlaybackControlsProps {
  audioBlob: Blob | null;
  recordingState: RecordingState;
  recordingDuration: number;
  onStartRecording: () => void;
  onResumeRecording: () => void;
  onPauseRecording: () => void;
  onDelete: () => void;
}
export const AudioPlaybackControls = ({
  audioBlob,
  recordingState,
  recordingDuration,
  onStartRecording,
  onResumeRecording,
  onPauseRecording,
  onDelete,
}: AudioPlaybackControlsProps) => {
  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const hasRecording = audioBlob !== null || recordingState !== "idle";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const confirmDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };
  if (!hasRecording) {
    return null;
  }
  return (
    <>
      <Card className="p-4 mt-6">
        <h3 className="font-semibold mb-4 text-center">Audio Recording</h3>

        {/* Main Controls */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "default"}
            onClick={() => {
              if (isRecording) {
                onPauseRecording();
              } else if (isPaused) {
                onResumeRecording();
              } else {
                onStartRecording();
              }
            }}
            className="h-12 rounded-full"
          >
            {isRecording ? <Pause className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="h-12 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Recording Duration */}
        <div className="flex items-center justify-center gap-2">
          {isRecording && <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />}
          <span className="text-sm font-medium tabular-nums">{formatDuration(recordingDuration)}</span>
        </div>
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
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
