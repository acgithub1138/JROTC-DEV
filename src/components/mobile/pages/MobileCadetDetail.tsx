import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar,
  Star,
  Edit,
  Save,
  X,
  GraduationCap,
  Award,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useCadet } from '@/hooks/useCadets';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getGradeColor } from '@/utils/gradeColors';

export const MobileCadetDetail: React.FC = () => {
  const { cadetId } = useParams<{ cadetId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { cadet, loading } = useCadet(cadetId!);
  const { toast } = useToast();
  
  const canEdit = location.state?.canEdit || false;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const isLeader = (cadet: any) => {
    return cadet.rank && (
      cadet.rank.toLowerCase().includes('captain') ||
      cadet.rank.toLowerCase().includes('lieutenant') ||
      cadet.rank.toLowerCase().includes('sergeant') ||
      cadet.rank.toLowerCase().includes('major') ||
      cadet.rank.toLowerCase().includes('colonel')
    );
  };

  const handleEdit = () => {
    setEditData({
      rank: cadet?.rank || '',
      grade: cadet?.grade || '',
      flight: cadet?.flight || '',
      cadet_year: cadet?.cadet_year || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    if (!cadet) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          rank: editData.rank || null,
          grade: editData.grade || null,
          flight: editData.flight || null,
          cadet_year: editData.cadet_year || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cadet.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cadet updated successfully"
      });

      setIsEditing(false);
      // In a real app, you'd refetch the cadet data here
    } catch (error) {
      console.error('Error updating cadet:', error);
      toast({
        title: "Error",
        description: "Failed to update cadet",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="space-y-4">
          {/* Profile Header Loading */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Details Loading */}
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-muted rounded animate-pulse w-1/3" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!cadet) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Cadet not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 relative">
          {/* Edit/Save/Cancel buttons in top right */}
          <div className="absolute top-4 right-4">
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {isEditing && (
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="mb-2 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/mobile/cadets')}
              className="mr-2 p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              {cadet.last_name}, {cadet.first_name}
              {isLeader(cadet) && <Star className="inline ml-2 h-5 w-5 text-yellow-500" />}
            </h1>
          </div>
            
          {cadet.grade && (
            <Badge className={`text-xs ${getGradeColor(cadet.grade)}`}>
              {cadet.grade}
            </Badge>
          )}
          
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <Mail className="h-4 w-4 mr-1" />
            {cadet.email}
          </div>
        </CardContent>
      </Card>

      {/* Military Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Cadet Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Input
                  id="rank"
                  value={editData.rank}
                  onChange={(e) => setEditData({...editData, rank: e.target.value})}
                  placeholder="Enter rank"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={editData.grade} onValueChange={(value) => setEditData({...editData, grade: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Freshman">Freshman</SelectItem>
                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="flight">Flight</Label>
                <Input
                  id="flight"
                  value={editData.flight}
                  onChange={(e) => setEditData({...editData, flight: e.target.value})}
                  placeholder="Enter flight"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cadet_year">Cadet Year</Label>
                <Select value={editData.cadet_year} onValueChange={(value) => setEditData({...editData, cadet_year: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cadet year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              {cadet.rank && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rank:</span>
                  <span className="font-medium">{cadet.rank}</span>
                </div>
              )}
              
              {cadet.grade && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Grade:</span>
                  <span className="font-medium">{cadet.grade}</span>
                </div>
              )}
              
              {cadet.flight && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Flight:</span>
                  <span className="font-medium">{cadet.flight}</span>
                </div>
              )}
              
              {cadet.cadet_year && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cadet Year:</span>
                  <span className="font-medium">{cadet.cadet_year} Year</span>
                </div>
              )}
              
              {!cadet.rank && !cadet.grade && !cadet.flight && !cadet.cadet_year && (
                <p className="text-sm text-muted-foreground">No military information available</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created:</span>
            <span className="font-medium">{formatDate(cadet.created_at)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Updated:</span>
            <span className="font-medium">{formatDate(cadet.updated_at)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};