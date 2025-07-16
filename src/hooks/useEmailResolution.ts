import { supabase } from "@/integrations/supabase/client";

export interface EmailResolutionResult {
  email: string;
  source: 'job_role' | 'profile';
}

/**
 * Resolves the best email address for a user using the simplified job_role_email approach
 * @param userId - The user's ID
 * @param schoolId - The user's school ID (maintained for compatibility)
 * @returns Email address and source information
 */
export const resolveUserEmail = async (userId: string, schoolId: string): Promise<EmailResolutionResult | null> => {
  try {
    // Get user profile with job_role_email and regular email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email, job_role_email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Use job_role_email if available, otherwise fall back to profile email
    if (profileData.job_role_email) {
      return {
        email: profileData.job_role_email,
        source: 'job_role'
      };
    }

    if (profileData.email) {
      return {
        email: profileData.email,
        source: 'profile'
      };
    }

    return null;
  } catch (error) {
    console.error('Error resolving user email:', error);
    return null;
  }
};