import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActiveAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementViewer } from '@/components/announcements/components/AnnouncementViewer';
import { 
  Megaphone, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const AnnouncementsWidget: React.FC = () => {
  const { data: announcements, isLoading } = useActiveAnnouncements();
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Megaphone className="w-5 h-5 mr-2 text-primary" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Megaphone className="w-5 h-5 mr-2 text-primary" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No active announcements</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Megaphone className="w-5 h-5 mr-2 text-primary" />
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const isExpanded = expandedAnnouncements.has(announcement.id);
            const hasLongContent = announcement.content.length > 200;
            
            return (
              <div
                key={announcement.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3 transition-all",
                  announcement.priority >= 8 && "border-red-200 bg-red-50/50",
                  announcement.priority >= 5 && announcement.priority < 8 && "border-yellow-200 bg-yellow-50/50",
                  announcement.priority < 5 && "border-border"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-tight mb-1">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {announcement.profiles ? 
                            `${announcement.profiles.first_name} ${announcement.profiles.last_name}` : 
                            'Unknown'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(announcement.publish_date), 'MMM d')}
                      </div>
                      {announcement.expire_date && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Expires {format(new Date(announcement.expire_date), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getPriorityColor(announcement.priority))}
                  >
                    {getPriorityLabel(announcement.priority)}
                  </Badge>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className={cn(
                    "transition-all duration-200",
                    !isExpanded && hasLongContent && "max-h-20 overflow-hidden relative"
                  )}>
                    <AnnouncementViewer 
                      content={announcement.content}
                      className="text-sm prose prose-sm max-w-none"
                    />
                    {!isExpanded && hasLongContent && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
                    )}
                  </div>
                  
                  {hasLongContent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(announcement.id)}
                      className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Show more
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};