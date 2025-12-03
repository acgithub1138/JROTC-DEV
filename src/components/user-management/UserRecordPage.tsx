import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, X, UserPlus, GraduationCap, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { User, UserRole, School } from "./types";
import { DynamicRole } from "@/hooks/useDynamicRoles";
import { ProfileHistoryTab } from "@/components/cadet-management/components/ProfileHistoryTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserPermissions } from "./hooks/useUserPermissions";
import UserForm from "./UserForm";

const UserRecordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const mode = searchParams.get("mode") || "create";
  const userId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<DynamicRole[]>([]);

  // Password reset states
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetConfirmOpen, setPasswordResetConfirmOpen] = useState(false);

  const { canResetPassword } = useUserPermissions();

  const initialUserData = {
    first_name: "",
    last_name: "",
    email: "",
    role_id: "",
    school_id: "",
    password: "",
    active: true,
  };

  const [userData, setUserData] = useState<typeof initialUserData>(initialUserData);
  const [originalData, setOriginalData] = useState<typeof initialUserData>(initialUserData);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: originalData,
    currentData: userData,
    enabled: true,
  });

  // Load user data for edit mode
  useEffect(() => {
    if (mode === "edit" && userId) {
      loadUserData();
    }
    fetchSchools();
    fetchAllowedRoles();
  }, [mode, userId]);

  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          user_roles (
            id,
            role_name,
            role_label
          )
        `,
        )
        .eq("id", userId)
        .single();

      if (error) throw error;

      const userRecord = {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        role_id: data.role_id || "",
        school_id: data.school_id || "",
        password: "", // Never load password
        active: data.active ?? true,
      };

      setUserData(userRecord);
      setOriginalData(userRecord);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
      navigate("/app/users");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      // Admins can see all schools, others only see their own
      let query = supabase.from("schools").select("id, name").order("name", { ascending: true });

      // If not admin, filter to only current user's school
      if (userProfile?.role !== "admin" && userProfile?.school_id) {
        query = query.eq("id", userProfile.school_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchools(data || []);

      // Set default school for non-admins in create mode
      if (mode === "create" && userProfile?.role !== "admin" && userProfile?.school_id) {
        setUserData((prev) => ({ ...prev, school_id: userProfile.school_id }));
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const fetchAllowedRoles = async () => {
    try {
      const { data, error } = await supabase.from("user_roles").select("*").eq("is_active", true).order("sort_order");

      if (error) throw error;

      // Filter roles based on user permissions
      const filtered = (data || []).filter((role) => {
        if (userProfile?.role === "admin") return true;
        if (userProfile?.role === "instructor") return !role.admin_only;
        return false;
      });

      setAllowedRoles(
        filtered.map((role) => ({
          id: role.id,
          role_name: role.role_name,
          role_label: role.role_label,
          admin_only: role.admin_only,
          is_active: role.is_active,
          sort_order: role.sort_order,
        })),
      );
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        // Get role name from role_id for edge function
        const selectedRole = allowedRoles.find((role) => role.id === userData.role_id);
        if (!selectedRole) {
          toast({
            title: "Error",
            description: "Please select a valid role",
            variant: "destructive",
          });
          return;
        }

        // Create new user using edge function
        const { data, error } = await supabase.functions.invoke("create-cadet-user", {
          body: {
            email: userData.email,
            password: userData.password,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: selectedRole.role_name,
            school_id: userData.school_id,
          },
        });

        if (error) {
          console.error("User creation error:", error);
          toast({
            title: "User Creation Failed",
            description: "There was an error creating the user. Please try again.",
            variant: "destructive",
          });
          return;
        } else if (data?.error) {
          console.error("User creation failed:", data.error);
          // Display the exact error message from the function
          toast({
            title: "User Creation Failed",
            description: data.error,
            variant: "destructive",
          });
          return;
        } else {
          toast({
            title: "User Created",
            description: "User has been created successfully.",
          });
        }
      } else {
        // Update existing user
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            role_id: userData.role_id || null,
            school_id: userData.school_id || null,
            active: userData.active,
          })
          .eq("id", userId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      }

      resetChanges();
      navigate("/app/users");
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: `Failed to ${mode === "create" ? "create" : "update"} user`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!userId || !newPassword) return;

    setPasswordResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: {
          userId,
          newPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Password reset successfully",
      });

      setNewPassword("");
      setPasswordResetConfirmOpen(false);
      setShowPassword(false);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "instructor":
        return <Shield className="w-4 h-4" />;
      case "command_staff":
        return <Users className="w-4 h-4" />;
      case "cadet":
        return <GraduationCap className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "parent":
        return <Users className="w-4 h-4" />;
      default:
        return <UserPlus className="w-4 h-4" />;
    }
  };

  const canEditSchool = () => {
    return userProfile?.role === "admin";
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    navigate("/app/users");
  };

  const handleDiscardChanges = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    navigate("/app/users");
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

  // Convert userData for password reset check
  const userForPasswordCheck =
    mode === "edit"
      ? ({
          id: userId!,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role_id: userData.role_id,
          school_id: userData.school_id,
          active: userData.active,
          created_at: new Date().toISOString(),
        } as User)
      : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{mode === "create" ? "Add User" : "Edit User"}</h2>
            <p className="text-muted-foreground">
              {mode === "create" ? "Create a new user account" : "Update user information"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : mode === "create" ? "Create User" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "edit" ? (
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : (
                "User Information"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "edit" ? (
              <Tabs defaultValue="edit" className="w-full">
                <TabsContent value="edit" className="mt-0">
                  <UserForm
                    userData={userData}
                    onUserDataChange={setUserData}
                    onSubmit={handleSubmit}
                    allowedRoles={allowedRoles}
                    schools={schools}
                    mode={mode}
                    canEditSchool={canEditSchool}
                    canResetPassword={userForPasswordCheck ? canResetPassword(userForPasswordCheck) : false}
                    userId={userId}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    setPasswordResetConfirmOpen={setPasswordResetConfirmOpen}
                    generateRandomPassword={generateRandomPassword}
                    getRoleIcon={getRoleIcon}
                  />
                </TabsContent>
                <TabsContent value="history" className="mt-0">
                  {userId && <ProfileHistoryTab profileId={userId} />}
                </TabsContent>
              </Tabs>
            ) : (
              <UserForm
                userData={userData}
                onUserDataChange={setUserData}
                onSubmit={handleSubmit}
                allowedRoles={allowedRoles}
                schools={schools}
                mode={mode}
                canEditSchool={canEditSchool}
                canResetPassword={userForPasswordCheck ? canResetPassword(userForPasswordCheck) : false}
                userId={userId}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                setPasswordResetConfirmOpen={setPasswordResetConfirmOpen}
                generateRandomPassword={generateRandomPassword}
                getRoleIcon={getRoleIcon}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password Reset Confirmation Dialog */}
      {passwordResetConfirmOpen && (
        <Dialog open={passwordResetConfirmOpen} onOpenChange={setPasswordResetConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to reset the password for {userData.first_name} {userData.last_name}?
                <br />
                <br />
                <strong>The user will need to use the new password to sign in.</strong>
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setPasswordResetConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={passwordResetLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {passwordResetLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </div>
  );
};

export default UserRecordPage;
