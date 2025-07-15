import { supabase } from "@/integrations/supabase/client";

export interface EmailResolutionResult {
  email: string;
  source: 'job_board' | 'profile';
}

/**
 * Resolves the best email address for a user by checking job board first, then profile
 * @param userId - The user's ID
 * @param schoolId - The user's school ID
 * @returns Email address and source information
 */
export const resolveUserEmail = async (userId: string, schoolId: string): Promise<EmailResolutionResult | null> => {
  try {
    // First, check if the user has a job board assignment with an email
    const { data: jobData, error: jobError } = await supabase
      .from('job_board')
      .select('email_address')
      .eq('cadet_id', userId)
      .eq('school_id', schoolId)
      .not('email_address', 'is', null)
      .neq('email_address', '')
      .maybeSingle();

    if (!jobError && jobData?.email_address) {
      return {
        email: jobData.email_address,
        source: 'job_board'
      };
    }

    // Fall back to profile email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError || !profileData?.email) {
      console.error('Error fetching profile email:', profileError);
      return null;
    }

    return {
      email: profileData.email,
      source: 'profile'
    };
  } catch (error) {
    console.error('Error resolving user email:', error);
    return null;
  }
};