import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, Shield, User, Edit, X, Save } from 'lucide-react';
import { toast } from 'sonner';

const MILITARY_BRANCHES = ['Air Force', 'Army', 'Marine Corps', 'Navy', 'Coast Guard', 'Space Force'];

const BRANCH_RANKS: Record<string, string[]> = {
  'Air Force': ['Airman Basic (AB)', 'Airman (Amn)', 'Airman First Class (A1C)', 'Senior Airman (SrA)', 'Staff Sergeant (SSgt)', 'Technical Sergeant (TSgt)', 'Master Sergeant (MSgt)', 'Senior Master Sergeant (SMSgt)', 'Chief Master Sergeant (CMSgt)'],
  'Army': ['Private (PVT)', 'Private (PV2)', 'Private First Class (PFC)', 'Specialist (SPC)', 'Corporal (CPL)', 'Sergeant (SGT)', 'Staff Sergeant (SSG)', 'Sergeant First Class (SFC)', 'Master Sergeant (MSG)', 'First Sergeant (1SG)', 'Sergeant Major (SGM)', 'Command Sergeant Major (CSM)'],
  'Marine Corps': ['Private (Pvt)', 'Private First Class (PFC)', 'Lance Corporal (LCpl)', 'Corporal (Cpl)', 'Sergeant (Sgt)', 'Staff Sergeant (SSgt)', 'Gunnery Sergeant (GySgt)', 'Master Sergeant (MSgt)', 'First Sergeant (1stSgt)', 'Master Gunnery Sergeant (MGySgt)', 'Sergeant Major (SgtMaj)'],
  'Navy': ['Seaman Recruit (SR)', 'Seaman Apprentice (SA)', 'Seaman (SN)', 'Petty Officer Third Class (PO3)', 'Petty Officer Second Class (PO2)', 'Petty Officer First Class (PO1)', 'Chief Petty Officer (CPO)', 'Senior Chief Petty Officer (SCPO)', 'Master Chief Petty Officer (MCPO)'],
  'Coast Guard': ['Seaman Recruit (SR)', 'Seaman Apprentice (SA)', 'Seaman (SN)', 'Petty Officer Third Class (PO3)', 'Petty Officer Second Class (PO2)', 'Petty Officer First Class (PO1)', 'Chief Petty Officer (CPO)', 'Senior Chief Petty Officer (SCPO)', 'Master Chief Petty Officer (MCPO)'],
  'Space Force': ['Specialist 1 (Spc1)', 'Specialist 2 (Spc2)', 'Specialist 3 (Spc3)', 'Specialist 4 (Spc4)', 'Sergeant (Sgt)', 'Technical Sergeant (TSgt)', 'Master Sergeant (MSgt)', 'Senior Master Sergeant (SMSgt)', 'Chief Master Sergeant (CMSgt)']
};

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  available: boolean;
  branch: string | null;
  rank: string | null;
  bio: string | null;
  user_id: string;
}

export const JudgesMyProfilePage = () => {
  const [profile, setProfile] = useState<JudgeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, control, reset, handleSubmit, watch } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      available: true,
      branch: '',
      rank: '',
      bio: ''
    }
  });

  const selectedBranch = watch('branch');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('cp_judges')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        
        // Reset form with fetched data
        reset({
          name: data.name || '',
          phone: data.phone || '',
          available: data.available ?? true,
          branch: data.branch || '',
          rank: data.rank || '',
          bio: data.bio || ''
        });
      } catch (error) {
        console.error('Error fetching judge profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (values: any) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cp_judges')
        .update({
          name: values.name,
          phone: values.phone,
          available: values.available,
          branch: values.branch,
          rank: values.rank,
          bio: values.bio
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        ...values
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: profile?.name || '',
      phone: profile?.phone || '',
      available: profile?.available ?? true,
      branch: profile?.branch || '',
      rank: profile?.rank || '',
      bio: profile?.bio || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-judge" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No judge profile found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Your judge profile information</p>
      </div>

      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Judge Information
              </CardTitle>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <Badge variant={profile.available ? "default" : "secondary"}>
                      {profile.available ? "Available" : "Unavailable"}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={handleSubmit(onSubmit)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isEditing ? (
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg">{profile.name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{profile.email}</p>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p>{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile.branch && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Branch</label>
                      <p>{profile.branch}</p>
                    </div>
                  </div>
                )}

                {profile.rank && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rank</label>
                    <p>{profile.rank}</p>
                  </div>
                )}

                {profile.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <p className="whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register('name')} />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} readOnly className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register('phone')} placeholder="(123) 456-7890" />
                </div>

                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Controller
                    name="branch"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="branch">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {MILITARY_BRANCHES.map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="rank">Rank</Label>
                  <Controller
                    name="rank"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={!selectedBranch}
                      >
                        <SelectTrigger id="rank">
                          <SelectValue placeholder={selectedBranch ? "Select rank" : "Select branch first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedBranch && BRANCH_RANKS[selectedBranch as keyof typeof BRANCH_RANKS]?.map((rank) => (
                            <SelectItem key={rank} value={rank}>
                              {rank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" {...register('bio')} rows={4} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Available for Judging</Label>
                  <Controller
                    name="available"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="available"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
