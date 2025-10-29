import { Card } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';
import { MobileNavButtons } from './MobileNavButtons';
import { format } from 'date-fns';

interface EventConfirmationStepProps {
  eventName: string;
  eventStartTime: string | null;
  eventLocation: string | null;
  onNext: () => void;
  onExit: () => void;
}

export const EventConfirmationStep = ({
  eventName,
  eventStartTime,
  eventLocation,
  onNext,
  onExit
}: EventConfirmationStepProps) => {
  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 p-6 flex flex-col justify-center overflow-y-auto">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Confirm Event</h1>
            <p className="text-muted-foreground">Please verify you're judging the correct event</p>
          </div>
          
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-4">{eventName}</h2>
            </div>
            
            {eventStartTime && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">
                    {format(new Date(eventStartTime), 'PPp')}
                  </p>
                </div>
              </div>
            )}
            
            {eventLocation && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{eventLocation}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      
      <MobileNavButtons
        onNext={onNext}
        onExit={onExit}
        showExit
      />
    </div>
  );
};
