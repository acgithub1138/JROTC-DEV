import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCPCadets, CPCadet, CPCadetFormData } from "@/hooks/competition-portal/useCPCadets";
import { useCPCadetsPermissions } from "@/hooks/useModuleSpecificPermissions";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GRADE_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior"];

type Mode = "create" | "edit" | "view";

export function CPCadetRecordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "view";
  const cadetId = searchParams.get("id");

  const { cadets, isLoading, createCadet, updateCadet, deleteCadet, isCreating, isUpdating, isDeleting } =
    useCPCadets();
  const { canCreate, canEdit, canDelete, canResetPassword } = useCPCadetsPermissions();

  const [formData, setFormData] = useState<CPCadetFormData>({
    first_name: "",
    last_name: "",
    email: "",
    grade: "",
  });
  const [originalData, setOriginalData] = useState<CPCadetFormData | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  const cadet = cadets.find((c) => c.id === cadetId);

  useEffect(() => {
    if (cadet && (mode === "edit" || mode === "view")) {
      const data = {
        first_name: cadet.first_name || "",
        last_name: cadet.last_name || "",
        email: cadet.email || "",
        grade: cadet.grade || "",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [cadet, mode]);

  const hasChanges = originalData
    ? JSON.stringify(formData) !== JSON.stringify(originalData)
    : Object.values(formData).some((v) => v !== "");

  const handleBack = () => {
    if (hasChanges) {
      setPendingNavigation("/app/competition-portal/cadets");
      setShowUnsavedDialog(true);
    } else {
      navigate("/app/competition-portal/cadets");
    }
  };

  const handleSave = async () => {
    if (mode === "create") {
      await createCadet(formData);
      navigate("/app/competition-portal/cadets");
    } else if (mode === "edit" && cadetId) {
      await updateCadet({ id: cadetId, ...formData });
      navigate("/app/competition-portal/cadets");
    }
  };

  const handleDelete = async () => {
    if (cadetId) {
      await deleteCadet(cadetId);
      navigate("/app/competition-portal/cadets");
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowUnsavedDialog(false);
  };

  const handleResetPassword = async () => {
    if (!cadetId || !newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setPasswordResetLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await supabase.functions.invoke("reset-user-password", {
        body: {
          targetUserId: cadetId,
          newPassword: newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to reset password");
      }

      toast.success("Password reset successfully");
      setNewPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const canSave = mode === "create" ? canCreate : canEdit;
  const isSaving = isCreating || isUpdating;

  const pageTitle = mode === "create" ? "Add Cadet" : mode === "edit" ? "Edit Cadet" : "View Cadet";

  if (isLoading && mode !== "create") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (mode !== "create" && !cadet && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Cadet not found.</p>
        <Button variant="outline" onClick={() => navigate("/app/competition-portal/cadets")}>
          Back to Cadets
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
              disabled={isViewMode}
              placeholder="Enter first name"
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
              disabled={isViewMode}
              placeholder="Enter last name"
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isViewMode}
              placeholder="Enter email address"
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="grade">Grade</Label>
            <Select
              value={formData.grade}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, grade: value }))}
              disabled={isViewMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {GRADE_OPTIONS.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Password Reset Section - Only visible in edit mode with permission */}
        {mode === "edit" && canResetPassword && cadetId && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="password-reset" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>Password Reset</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleResetPassword}
                      disabled={passwordResetLoading || !newPassword}
                      variant="secondary"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {passwordResetLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="flex justify-between pt-4">
          <div>
            {mode === "edit" && canDelete && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            {!isViewMode && canSave && (
              <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleConfirmNavigation}
        onCancel={() => setShowUnsavedDialog(false)}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cadet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {formData.last_name}, {formData.first_name}? This action will deactivate
              the cadet account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
