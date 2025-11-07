import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ArrowLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCommunityService } from './hooks/useCommunityService';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface CadetOption {
  id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  rank: string | null;
}

export const CommunityServiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userProfile } = useAuth();
  const [selectedCadetIds, setSelectedCadetIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [event, setEvent] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const { bulkCreateRecords, isBulkCreating } = useCommunityService();

  // Fetch all cadets for selection
  const { data: cadets = [], isLoading: cadetsLoading } = useQuery({
    queryKey: ['cadets-for-community-service', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, grade, rank')
        .eq('school_id', userProfile.school_id)
        .eq('active', true)
        .neq('role', 'instructor')
        .order('last_name');
      
      if (error) {
        console.error('Error fetching cadets:', error);
        throw error;
      }
      return data as CadetOption[];
    },
    enabled: !!userProfile?.school_id
  });

  // Filter cadets based on search term
  const filteredCadets = cadets.filter(cadet => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${cadet.first_name} ${cadet.last_name}`.toLowerCase();
    return fullName.includes(searchLower) || 
           cadet.grade?.toLowerCase().includes(searchLower);
  });

  // Track changes for unsaved dialog
  useEffect(() => {
    const hasChanges = selectedCadetIds.length > 0 || event.trim() !== '' || hours.trim() !== '' || notes.trim() !== '';
    setHasUnsavedChanges(hasChanges);
  }, [selectedCadetIds, event, hours, notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || selectedCadetIds.length === 0 || !event || !hours) {
      return;
    }
    
    const data = {
      cadetIds: selectedCadetIds,
      date: date.toISOString().split('T')[0],
      event: event.trim(),
      hours: parseFloat(hours),
      notes: notes.trim() || undefined
    };

    bulkCreateRecords(data);
    setHasUnsavedChanges(false);
    navigate(-1);
  };

  const handleToggleCadet = (cadetId: string) => {
    setSelectedCadetIds(prev => 
      prev.includes(cadetId) 
        ? prev.filter(id => id !== cadetId)
        : [...prev, cadetId]
    );
  };

  const handleRemoveCadet = (cadetId: string) => {
    setSelectedCadetIds(prev => prev.filter(id => id !== cadetId));
  };

  const getSelectedCadets = () => {
    return cadets.filter(cadet => selectedCadetIds.includes(cadet.id));
  };

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation === 'back') {
      navigate(-1);
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (hasUnsavedChanges) {
                setPendingNavigation('back');
                setShowUnsavedDialog(true);
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cadets
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Add Community Service Records</h1>
        <p className="text-muted-foreground mt-1">
          Create community service records for one or multiple cadets
        </p>
      </div>

      {/* Mobile Action Buttons */}
      {isMobile && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (hasUnsavedChanges) {
                setPendingNavigation('back');
                setShowUnsavedDialog(true);
              } else {
                navigate(-1);
              }
            }}
            className="w-full"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isBulkCreating || selectedCadetIds.length === 0}
            onClick={handleSubmit}
            className="w-full"
          >
            {isBulkCreating 
              ? 'Creating...' 
              : `Add for ${selectedCadetIds.length}`
            }
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Community Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Cadets Display */}
            {selectedCadetIds.length > 0 && (
              <div>
                <Label className="mb-2 block">Selected Cadets ({selectedCadetIds.length})</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
                  {getSelectedCadets().map(cadet => (
                    <Badge key={cadet.id} variant="secondary" className="flex items-center gap-1">
                      {cadet.last_name}, {cadet.first_name}
                      {cadet.grade && ` (${cadet.grade})`}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveCadet(cadet.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Cadet Selection */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:gap-4">
              <Label className="sm:w-32 sm:text-right text-left sm:shrink-0 sm:pt-2">Select Cadets *</Label>
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Search cadets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <ScrollArea className="h-48 border rounded-md p-2">
                  {cadetsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading cadets...</div>
                  ) : filteredCadets.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No cadets found</div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCadets.map(cadet => (
                        <div key={cadet.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cadet-${cadet.id}`}
                            checked={selectedCadetIds.includes(cadet.id)}
                            onCheckedChange={() => handleToggleCadet(cadet.id)}
                          />
                          <Label 
                            htmlFor={`cadet-${cadet.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            {cadet.last_name}, {cadet.first_name}
                            {cadet.grade && ` (${cadet.grade})`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-4">
              {/* Date */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                <Label className="sm:w-32 sm:text-right text-left sm:shrink-0">Date *</Label>
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={date} 
                        onSelect={setDate} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Hours */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                <Label htmlFor="hours" className="sm:w-32 sm:text-right text-left sm:shrink-0">Hours *</Label>
                <div className="flex-1">
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>
              </div>

              {/* Activity/Event */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                <Label htmlFor="event" className="sm:w-32 sm:text-right text-left sm:shrink-0">Activity/Event *</Label>
                <div className="flex-1">
                  <Input
                    id="event"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    placeholder="e.g., Food bank volunteer, Park cleanup"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:gap-4">
              <Label htmlFor="notes" className="sm:w-32 sm:text-right text-left sm:shrink-0 sm:pt-2">Event Description</Label>
              <div className="flex-1">
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add details about the event..."
                  rows={3}
                />
              </div>
            </div>

            {/* Desktop Action Buttons */}
            {!isMobile && (
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setPendingNavigation('back');
                      setShowUnsavedDialog(true);
                    } else {
                      navigate(-1);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isBulkCreating || selectedCadetIds.length === 0}
                >
                  {isBulkCreating 
                    ? 'Creating Records...' 
                    : `Add Service for ${selectedCadetIds.length} Cadet${selectedCadetIds.length !== 1 ? 's' : ''}`
                  }
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelNavigation}
      />
    </div>
  );
};