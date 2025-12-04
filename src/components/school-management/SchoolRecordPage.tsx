import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowLeft, Save, X } from "lucide-react";
import { format, addYears } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { COMMON_TIMEZONES } from "@/utils/timezoneUtils";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { FileUpload } from "@/components/ui/file-upload";

interface School {
  id: string;
  name: string;
  initials?: string;
  jrotc_program?: "air_force" | "army" | "coast_guard" | "navy" | "marine_corps" | "space_force";
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  ccc_portal?: boolean;
  comp_analytics?: boolean;
  comp_hosting?: boolean;
  comp_basic?: boolean;
  subscription_start?: string;
  subscription_end?: string;
  referred_by?: string;
  notes?: string;
  timezone?: string;
  logo_url?: string;
  created_at: string;
}

const SchoolRecordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const mode = searchParams.get("mode") || "create";
  const schoolId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const initialSchool: Omit<School, "id" | "created_at"> = {
    name: "",
    initials: "",
    jrotc_program: "air_force",
    contact: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    ccc_portal: false,
    comp_analytics: false,
    comp_hosting: false,
    comp_basic: false,
    subscription_start: undefined,
    subscription_end: undefined,
    referred_by: "",
    notes: "",
    timezone: "America/New_York",
  };

  const [schoolData, setSchoolData] = useState<Omit<School, "id" | "created_at">>(initialSchool);
  const [originalData, setOriginalData] = useState<Omit<School, "id" | "created_at">>(initialSchool);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: originalData,
    currentData: schoolData,
    enabled: true,
  });

  // Load school data for edit mode
  useEffect(() => {
    if (mode === "edit" && schoolId) {
      loadSchoolData();
    }
  }, [mode, schoolId]);

  const loadSchoolData = async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.from("schools").select("*").eq("id", schoolId).single();

      if (error) throw error;

      const schoolRecord = {
        name: data.name || "",
        initials: data.initials || "",
        jrotc_program: data.jrotc_program || "air_force",
        contact: data.contact || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip_code: data.zip_code || "",
        phone: data.phone || "",
        email: data.email || "",
        comp_analytics: data.comp_analytics || false,
        comp_hosting: data.comp_hosting || false,
        comp_basic: data.comp_basic || false,
        subscription_start: data.subscription_start || undefined,
        subscription_end: data.subscription_end || undefined,
        referred_by: data.referred_by || "",
        notes: data.notes || "",
        timezone: data.timezone || "America/New_York",
        logo_url: data.logo_url || undefined,
      };

      setSchoolData(schoolRecord);
      setOriginalData(schoolRecord);
    } catch (error) {
      console.error("Error loading school data:", error);
      toast({
        title: "Error",
        description: "Failed to load school data",
        variant: "destructive",
      });
      navigate("/app/school");
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File, targetSchoolId: string): Promise<string | null> => {
    try {
      setIsUploadingLogo(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${targetSchoolId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("school-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("school-logos").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        // Create new school
        const { data, error } = await supabase.from("schools").insert([schoolData]).select().single();

        if (error) throw error;

        // Upload logo if provided
        let logoUrl = null;
        if (logoFile) {
          logoUrl = await uploadLogo(logoFile, data.id);
          if (logoUrl) {
            await supabase.from("schools").update({ logo_url: logoUrl }).eq("id", data.id);
          }
        }

        toast({
          title: "Success",
          description: "School created successfully",
        });
      } else {
        // Update existing school
        let logoUrl = schoolData.logo_url;

        // Upload logo if a new file was selected
        if (logoFile && schoolId) {
          logoUrl = await uploadLogo(logoFile, schoolId);
          if (!logoUrl) return; // Upload failed
        }

        const { error } = await supabase
          .from("schools")
          .update({
            ...schoolData,
            logo_url: logoUrl,
          })
          .eq("id", schoolId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "School updated successfully",
        });
      }

      resetChanges();
      navigate("/app/school");
    } catch (error) {
      console.error("Error saving school:", error);
      toast({
        title: "Error",
        description: `Failed to ${mode === "create" ? "create" : "update"} school`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    navigate("/app/school");
  };

  const handleDiscardChanges = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    navigate("/app/school");
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Schools
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{mode === "create" ? "Add School" : "Edit School"}</h2>
            <p className="text-muted-foreground">
              {mode === "create" ? "Create a new school record" : "Update school information"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting || isUploadingLogo}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploadingLogo}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting || isUploadingLogo ? "Saving..." : mode === "create" ? "Create School" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right">
                    School Name *
                  </Label>
                  <Input
                    id="name"
                    value={schoolData.name}
                    onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                    placeholder="Enter school name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initials" className="text-right">
                    School Initials
                  </Label>
                  <Input
                    id="initials"
                    value={schoolData.initials || ""}
                    onChange={(e) => setSchoolData({ ...schoolData, initials: e.target.value })}
                    placeholder="Enter school initials"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <FileUpload
                label="School Logo"
                accept="image/*"
                maxSize={5}
                onFileSelect={setLogoFile}
                onFileDelete={() => {
                  setSchoolData({ ...schoolData, logo_url: undefined });
                  setLogoFile(null);
                }}
                currentFileUrl={schoolData.logo_url}
                disabled={isUploadingLogo}
              />

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-right">
                    Contact
                  </Label>
                  <Input
                    id="contact"
                    value={schoolData.contact || ""}
                    onChange={(e) => setSchoolData({ ...schoolData, contact: e.target.value })}
                    placeholder="Enter contact person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jrotc_program" className="text-right">
                    JROTC Program
                  </Label>
                  <Select
                    value={schoolData.jrotc_program || "air_force"}
                    onValueChange={(value) =>
                      setSchoolData({
                        ...schoolData,
                        jrotc_program: value as School["jrotc_program"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select JROTC Program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air_force">Air Force JROTC</SelectItem>
                      <SelectItem value="army">Army JROTC</SelectItem>
                      <SelectItem value="coast_guard">Coast Guard JROTC</SelectItem>
                      <SelectItem value="navy">Navy JROTC</SelectItem>
                      <SelectItem value="marine_corps">Marine Corps JROTC</SelectItem>
                      <SelectItem value="space_force">Space Force JROTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  value={schoolData.address || ""}
                  onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-right">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={schoolData.city || ""}
                    onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-right">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={schoolData.state || ""}
                    onChange={(e) => setSchoolData({ ...schoolData, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="text-right">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip_code"
                    value={schoolData.zip_code || ""}
                    onChange={(e) => setSchoolData({ ...schoolData, zip_code: e.target.value })}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={schoolData.phone || ""}
                    onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={schoolData.email || ""}
                    onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {/* Subscription Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subscription_start" className="text-right">
                    Subscription Start
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {schoolData.subscription_start ? (
                          format(new Date(schoolData.subscription_start), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={schoolData.subscription_start ? new Date(schoolData.subscription_start) : undefined}
                        onSelect={(date) => {
                          const startDate = date ? date.toISOString().split("T")[0] : undefined;
                          const endDate = date ? addYears(date, 1).toISOString().split("T")[0] : undefined;
                          setSchoolData({
                            ...schoolData,
                            subscription_start: startDate,
                            subscription_end: endDate,
                          });
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_end" className="text-right">
                    Subscription End
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {schoolData.subscription_end ? (
                          format(new Date(schoolData.subscription_end), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={schoolData.subscription_end ? new Date(schoolData.subscription_end) : undefined}
                        onSelect={(date) =>
                          setSchoolData({
                            ...schoolData,
                            subscription_end: date ? date.toISOString().split("T")[0] : undefined,
                          })
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-2">
                <Label htmlFor="referred_by" className="text-right">
                  Referred By
                </Label>
                <Input
                  id="referred_by"
                  value={schoolData.referred_by || ""}
                  onChange={(e) => setSchoolData({ ...schoolData, referred_by: e.target.value })}
                  placeholder="Who referred this school?"
                />
              </div>

              {/* Module Settings */}
              <div className="grid grid-cols-4 gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ccc_portal"
                    checked={schoolData.ccc_portal || false}
                    onCheckedChange={(checked) =>
                      setSchoolData({
                        ...schoolData,
                        ccc_portal: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="ccc_portal">CCC Portal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comp_basic"
                    checked={schoolData.comp_basic || false}
                    onCheckedChange={(checked) =>
                      setSchoolData({
                        ...schoolData,
                        comp_basic: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="comp_basic">Comp Basic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comp_analytics"
                    checked={schoolData.comp_analytics || false}
                    onCheckedChange={(checked) =>
                      setSchoolData({
                        ...schoolData,
                        comp_analytics: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="comp_analytics">Comp Analytics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comp_hosting"
                    checked={schoolData.comp_hosting || false}
                    onCheckedChange={(checked) =>
                      setSchoolData({
                        ...schoolData,
                        comp_hosting: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="comp_hosting">Comp Hosting</Label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={schoolData.notes || ""}
                  onChange={(e) => setSchoolData({ ...schoolData, notes: e.target.value })}
                  placeholder="Additional notes about this school..."
                  rows={3}
                />
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-right">
                  Timezone
                </Label>
                <Select
                  value={schoolData.timezone || "America/New_York"}
                  onValueChange={(value) => setSchoolData({ ...schoolData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </div>
  );
};

export default SchoolRecordPage;
