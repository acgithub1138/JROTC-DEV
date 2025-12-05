import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, Shield, User, Edit, X, Save } from "lucide-react";
import { toast } from "sonner";
const MILITARY_BRANCHES = ["Air Force", "Army", "Marine Corps", "Navy", "Coast Guard", "Space Force"];
const BRANCH_RANKS: Record<string, string[]> = {
  "Air Force": [
    "Airman Basic (AB)",
    "Airman (Amn)",
    "Airman First Class (A1C)",
    "Senior Airman (SrA)",
    "Staff Sergeant (SSgt)",
    "Technical Sergeant (TSgt)",
    "Master Sergeant (MSgt)",
    "Senior Master Sergeant (SMSgt)",
    "Chief Master Sergeant (CMSgt)",
  ],
  Army: [
    "Private (PVT)",
    "Private (PV2)",
    "Private First Class (PFC)",
    "Specialist (SPC)",
    "Corporal (CPL)",
    "Sergeant (SGT)",
    "Staff Sergeant (SSG)",
    "Sergeant First Class (SFC)",
    "Master Sergeant (MSG)",
    "First Sergeant (1SG)",
    "Sergeant Major (SGM)",
    "Command Sergeant Major (CSM)",
  ],
  "Marine Corps": [
    "Private (Pvt)",
    "Private First Class (PFC)",
    "Lance Corporal (LCpl)",
    "Corporal (Cpl)",
    "Sergeant (Sgt)",
    "Staff Sergeant (SSgt)",
    "Gunnery Sergeant (GySgt)",
    "Master Sergeant (MSgt)",
    "First Sergeant (1stSgt)",
    "Master Gunnery Sergeant (MGySgt)",
    "Sergeant Major (SgtMaj)",
  ],
  Navy: [
    "Seaman Recruit (SR)",
    "Seaman Apprentice (SA)",
    "Seaman (SN)",
    "Petty Officer Third Class (PO3)",
    "Petty Officer Second Class (PO2)",
    "Petty Officer First Class (PO1)",
    "Chief Petty Officer (CPO)",
    "Senior Chief Petty Officer (SCPO)",
    "Master Chief Petty Officer (MCPO)",
  ],
  "Coast Guard": [
    "Seaman Recruit (SR)",
    "Seaman Apprentice (SA)",
    "Seaman (SN)",
    "Petty Officer Third Class (PO3)",
    "Petty Officer Second Class (PO2)",
    "Petty Officer First Class (PO1)",
    "Chief Petty Officer (CPO)",
    "Senior Chief Petty Officer (SCPO)",
    "Master Chief Petty Officer (MCPO)",
  ],
  "Space Force": [
    "Specialist 1 (Spc1)",
    "Specialist 2 (Spc2)",
    "Specialist 3 (Spc3)",
    "Specialist 4 (Spc4)",
    "Sergeant (Sgt)",
    "Technical Sergeant (TSgt)",
    "Master Sergeant (MSgt)",
    "Senior Master Sergeant (SMSgt)",
    "Chief Master Sergeant (CMSgt)",
  ],
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
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<JudgeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { register, control, reset, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      available: true,
      branch: "",
      rank: "",
      bio: "",
    },
  });
  const selectedBranch = watch("branch");
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from("cp_judges").select("*").eq("user_id", user.id).single();
        if (error) throw error;
        setProfile(data);

        // Reset form with fetched data
        reset({
          name: data.name || "",
          phone: data.phone || "",
          available: data.available ?? true,
          branch: data.branch || "",
          rank: data.rank || "",
          bio: data.bio || "",
        });
      } catch (error) {
        console.error("Error fetching judge profile:", error);
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
        .from("cp_judges")
        .update({
          name: values.name,
          phone: values.phone,
          available: values.available,
          branch: values.branch,
          rank: values.rank,
          bio: values.bio,
        })
        .eq("id", profile.id);
      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        ...values,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    reset({
      name: profile?.name || "",
      phone: profile?.phone || "",
      available: profile?.available ?? true,
      branch: profile?.branch || "",
      rank: profile?.rank || "",
      bio: profile?.bio || "",
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-judge/5">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-judge to-judge/70 bg-clip-text text-black">
            My Profile
          </h1>
          <p className="text-muted-foreground text-lg">Manage your judge profile information</p>
        </div>

        <div>
          <Card className="shadow-xl border-2 border-judge/10 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-judge via-judge/70 to-judge/50" />
            <CardHeader className="bg-gradient-to-br from-card to-judge/5 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-black" />
                  </div>
                  Judge Information
                </CardTitle>
                <div className="flex items-center gap-3">
                  {!isEditing ? (
                    <>
                      {isMobile ? (
                        <Checkbox 
                          checked={profile.available} 
                          disabled
                          className="h-5 w-5"
                        />
                      ) : (
                        <Badge
                          variant={profile.available ? "default" : "secondary"}
                          className="px-4 py-2 text-sm font-semibold shadow-sm"
                        >
                          {profile.available ? "✓ Available" : "○ Unavailable"}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className={isMobile ? "px-2" : "flex-1"}
                      >
                        <Edit className="h-4 w-4" />
                        {!isMobile && <span className="ml-2">Edit Profile</span>}
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
                        className={`hover:bg-destructive/10 hover:border-destructive transition-all ${isMobile ? "px-2" : ""}`}
                      >
                        <X className="h-4 w-4" />
                        {!isMobile && <span className="ml-2">Cancel</span>}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSaving}
                        onClick={handleSubmit(onSubmit)}
                        className={isMobile ? "px-2" : ""}
                      >
                        <Save className="h-4 w-4" />
                        {!isMobile && <span className="ml-2">{isSaving ? "Saving..." : "Save Changes"}</span>}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {!isEditing ? (
                <div className="grid gap-6">
                  <div className="group">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
                    <p className="text-xl font-semibold mt-1 group-hover:text-judge transition-colors">
                      {profile.name}
                    </p>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-judge/5 to-transparent border border-judge/10 hover:border-judge/20 transition-all">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md flex-shrink-0">
                      <Mail className="h-5 w-5 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Email Address
                      </label>
                      <p className="text-base font-medium mt-1 break-all">{profile.email}</p>
                    </div>
                  </div>

                  {profile.phone && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-judge/5 to-transparent border border-judge/10 hover:border-judge/20 transition-all">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md flex-shrink-0">
                        <Phone className="h-5 w-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Phone Number
                        </label>
                        <p className="text-base font-medium mt-1">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {(profile.branch || profile.rank) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {profile.branch && (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-judge/5 to-transparent border border-judge/10 hover:border-judge/20 transition-all">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md flex-shrink-0">
                            <Shield className="h-5 w-5 text-black" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Military Branch
                            </label>
                            <p className="text-base font-medium mt-1">{profile.branch}</p>
                          </div>
                        </div>
                      )}

                      {profile.rank && (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-judge/5 to-transparent border border-judge/10 hover:border-judge/20 transition-all">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md flex-shrink-0">
                            <Shield className="h-5 w-5 text-black" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Rank
                            </label>
                            <p className="text-base font-medium mt-1">{profile.rank}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {profile.bio && (
                    <div className="p-6 rounded-lg bg-gradient-to-br from-judge/5 via-transparent to-judge/5 border border-judge/10">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Biography
                      </label>
                      <p className="text-base mt-3 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className="border-judge/20 focus:border-judge focus:ring-judge/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={profile.email}
                      readOnly
                      className="bg-muted/50 border-muted-foreground/20 cursor-not-allowed h-11"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email address cannot be modified
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="(123) 456-7890"
                      className="border-judge/20 focus:border-judge focus:ring-judge/20 h-11"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="branch" className="text-sm font-semibold">
                        Military Branch
                      </Label>
                      <Controller
                        name="branch"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger
                              id="branch"
                              className="border-judge/20 focus:border-judge focus:ring-judge/20 h-11"
                            >
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

                    <div className="space-y-2">
                      <Label htmlFor="rank" className="text-sm font-semibold">
                        Rank
                      </Label>
                      <Controller
                        name="rank"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={!selectedBranch}>
                            <SelectTrigger
                              id="rank"
                              className="border-judge/20 focus:border-judge focus:ring-judge/20 h-11 disabled:opacity-50"
                            >
                              <SelectValue placeholder={selectedBranch ? "Select rank" : "Select branch first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedBranch &&
                                BRANCH_RANKS[selectedBranch as keyof typeof BRANCH_RANKS]?.map((rank) => (
                                  <SelectItem key={rank} value={rank}>
                                    {rank}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-semibold">
                      Biography
                    </Label>
                    <Textarea
                      id="bio"
                      {...register("bio")}
                      rows={5}
                      placeholder="Share your experience and background..."
                      className="border-judge/20 focus:border-judge focus:ring-judge/20 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-judge/5 to-transparent border border-judge/10">
                    <div>
                      <Label htmlFor="available" className="text-base font-semibold cursor-pointer">
                        Available for Judging
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">Allow others to see your availability status</p>
                    </div>
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
    </div>
  );
};
