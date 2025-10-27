import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useJudgeProfile } from '@/hooks/judges-portal/useJudgeProfile';
import { User, Mail, Phone, Check } from 'lucide-react';

export const JudgeProfilePage = () => {
  const { judgeProfile, createProfile, updateProfile, isCreating, isUpdating } = useJudgeProfile();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    available: true
  });

  // Populate form when profile loads
  useEffect(() => {
    if (judgeProfile) {
      setFormData({
        name: judgeProfile.name || '',
        email: judgeProfile.email || '',
        phone: judgeProfile.phone || '',
        available: judgeProfile.available
      });
    }
  }, [judgeProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (judgeProfile) {
      updateProfile({
        id: judgeProfile.id,
        updates: formData
      });
    } else {
      createProfile(formData);
    }
  };

  const isFormValid = formData.name.trim().length > 0;
  const isSaving = isCreating || isUpdating;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {judgeProfile ? 'My Judge Profile' : 'Create Judge Profile'}
        </h1>
        <p className="text-muted-foreground">
          {judgeProfile 
            ? 'Manage your judge profile and availability'
            : 'Create your profile to start applying to competitions'
          }
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="pl-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Competition organizers will use this to contact you
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="pl-9"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="available" className="text-base">
                Available for Judging
              </Label>
              <p className="text-sm text-muted-foreground">
                Toggle this off if you're temporarily unavailable
              </p>
            </div>
            <Switch
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>Saving...</>
              ) : judgeProfile ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                'Create Profile'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {judgeProfile && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold mb-2">Profile Information</h3>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Profile created on {new Date(judgeProfile.created_at).toLocaleDateString()}
            </p>
            <p className="text-muted-foreground">
              Last updated on {new Date(judgeProfile.updated_at).toLocaleDateString()}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
