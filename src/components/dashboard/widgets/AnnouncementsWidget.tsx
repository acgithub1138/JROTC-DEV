import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { useActiveAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementViewer } from '@/components/announcements/components/AnnouncementViewer';
import { AnnouncementAttachments } from './AnnouncementAttachments';
import { Megaphone, ChevronDown, ChevronUp, Calendar, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
export const AnnouncementsWidget: React.FC = () => {
  const {
    data: announcements,
    isLoading
  } = useActiveAnnouncements();
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<any>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Track carousel state
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Auto-rotation effect for carousel
  useEffect(() => {
    if (!api || !announcements || announcements.length <= 1) return;

    const startAutoRotation = () => {
      intervalRef.current = setInterval(() => {
        api.scrollNext();
      }, 3000);
    };

    const stopAutoRotation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    startAutoRotation();

    // Pause on hover/interaction
    const container = api.rootNode();
    if (container) {
      container.addEventListener('mouseenter', stopAutoRotation);
      container.addEventListener('mouseleave', startAutoRotation);
    }

    return () => {
      stopAutoRotation();
      if (container) {
        container.removeEventListener('mouseenter', stopAutoRotation);
        container.removeEventListener('mouseleave', startAutoRotation);
      }
    };
  }, [api, announcements]);

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
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Megaphone className="w-5 h-5 mr-2 text-primary" />
              Announcements
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsWidgetExpanded(!isWidgetExpanded)} className="h-auto p-1">
              {isWidgetExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        {isWidgetExpanded && <CardContent className="animate-accordion-down">
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-16 bg-muted rounded" />
                </div>)}
            </div>
          </CardContent>}
      </Card>;
  }
  if (!announcements || announcements.length === 0) {
    return null;
  }
  return <>
    <Card className="w-full">
      <CardHeader className="py-[8px]">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Megaphone className="w-5 h-5 mr-2 text-primary" />
            Announcements
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsWidgetExpanded(!isWidgetExpanded)} className="h-auto p-1">
            {isWidgetExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {isWidgetExpanded && <CardContent className="animate-accordion-down py-[8px]">
          {announcements.length === 1 ? (
            // Single announcement - display as before
            <div className="space-y-4">
              {announcements.map(announcement => {
                const isExpanded = expandedAnnouncements.has(announcement.id);
                const hasLongContent = announcement.content.length > 200;
                return (
                  <div key={announcement.id} className={cn("border rounded-lg p-4 space-y-3 transition-all", announcement.priority >= 8 && "border-red-200 bg-red-50/50", announcement.priority >= 5 && announcement.priority < 8 && "border-yellow-200 bg-yellow-50/50", announcement.priority < 5 && "border-border")}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-medium text-sm leading-tight mb-1 cursor-pointer hover:text-primary transition-colors" 
                          onClick={() => setViewingAnnouncement(announcement)}
                        >
                          {announcement.title}
                        </h3>
                      </div>
                      <Badge variant="secondary" className={cn("text-xs", getPriorityColor(announcement.priority))}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className={cn("transition-all duration-200", !isExpanded && hasLongContent && "max-h-20 overflow-hidden relative")}>
                        <AnnouncementViewer content={announcement.content} className="text-sm prose prose-sm max-w-none" />
                        {!isExpanded && hasLongContent && <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />}
                      </div>
                      
                      {hasLongContent && <Button variant="ghost" size="sm" onClick={() => toggleExpanded(announcement.id)} className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
                          {isExpanded ? <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              Show less
                            </> : <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              Show more
                            </>}
                        </Button>}
                      
                      <AnnouncementAttachments announcementId={announcement.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Multiple announcements - use carousel
            <div className="relative">
              <Carousel setApi={setApi} className="w-full">
                <div className="px-12">
                  <CarouselContent>
                    {announcements.map(announcement => {
                      const isExpanded = expandedAnnouncements.has(announcement.id);
                      const hasLongContent = announcement.content.length > 200;
                      return (
                        <CarouselItem key={announcement.id}>
                          <div className={cn("border rounded-lg p-4 space-y-3 transition-all", announcement.priority >= 8 && "border-red-200 bg-red-50/50", announcement.priority >= 5 && announcement.priority < 8 && "border-yellow-200 bg-yellow-50/50", announcement.priority < 5 && "border-border")}>
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 
                                  className="font-medium text-sm leading-tight mb-1 cursor-pointer hover:text-primary transition-colors" 
                                  onClick={() => setViewingAnnouncement(announcement)}
                                >
                                  {announcement.title}
                                </h3>
                              </div>
                              <Badge variant="secondary" className={cn("text-xs", getPriorityColor(announcement.priority))}>
                                {getPriorityLabel(announcement.priority)}
                              </Badge>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <div className={cn("transition-all duration-200", !isExpanded && hasLongContent && "max-h-20 overflow-hidden relative")}>
                                <AnnouncementViewer content={announcement.content} className="text-sm prose prose-sm max-w-none" />
                                {!isExpanded && hasLongContent && <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />}
                              </div>
                              
                              {hasLongContent && <Button variant="ghost" size="sm" onClick={() => toggleExpanded(announcement.id)} className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
                                  {isExpanded ? <>
                                      <ChevronUp className="w-3 h-3 mr-1" />
                                      Show less
                                    </> : <>
                                      <ChevronDown className="w-3 h-3 mr-1" />
                                      Show more
                                    </>}
                                </Button>}
                              
                              <AnnouncementAttachments announcementId={announcement.id} />
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                </div>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
              
              {/* Dot indicators */}
              <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: count }).map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      current === index + 1 
                        ? "bg-primary scale-125" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    onClick={() => api?.scrollTo(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>}
    </Card>

    {/* View Modal */}
    <Dialog open={!!viewingAnnouncement} onOpenChange={(open) => !open && setViewingAnnouncement(null)}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{viewingAnnouncement?.title}</span>
            <Badge variant="secondary" className={cn("text-xs", getPriorityColor(viewingAnnouncement?.priority || 0))}>
              {getPriorityLabel(viewingAnnouncement?.priority || 0)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View the full announcement details and attachments
          </DialogDescription>
        </DialogHeader>
        
        {viewingAnnouncement && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Published: {format(new Date(viewingAnnouncement.publish_date), 'MMM d, yyyy')}
              {viewingAnnouncement.expire_date && (
                <> • Expires: {format(new Date(viewingAnnouncement.expire_date), 'MMM d, yyyy')}</>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <AnnouncementViewer content={viewingAnnouncement.content} />
            </div>
            
            <AnnouncementAttachments announcementId={viewingAnnouncement.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>;
};