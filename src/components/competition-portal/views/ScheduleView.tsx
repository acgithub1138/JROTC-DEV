import { EventScheduleView } from '../components/schedule/EventScheduleView';
import { JudgeScheduleView } from '../components/schedule/JudgeScheduleView';
import { ResourceScheduleView } from '../components/schedule/ResourceScheduleView';

interface ScheduleViewProps {
  competitionId: string;
  type: 'schools' | 'judges' | 'resources';
  readOnly?: boolean;
}

export const ScheduleView = ({ competitionId, type, readOnly = false }: ScheduleViewProps) => {
  if (type === 'schools') {
    return <EventScheduleView competitionId={competitionId} readOnly={readOnly} />;
  }

  if (type === 'judges') {
    return <JudgeScheduleView competitionId={competitionId} />;
  }

  if (type === 'resources') {
    return <ResourceScheduleView competitionId={competitionId} />;
  }

  return null;
};
