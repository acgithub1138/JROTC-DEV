import { supabase } from "@/integrations/supabase/client";
import { buildJobHierarchy } from "@/components/job-board/utils/hierarchyBuilder";
import { JobBoardWithCadet } from "@/components/job-board/types";

export interface EmailResolutionResult {
  email: string;
  source: 'job_board' | 'profile';
}

/**
 * Resolves the best email address for a user by checking job board assignments with hierarchy priority, then profile
 * @param userId - The user's ID
 * @param schoolId - The user's school ID
 * @returns Email address and source information with hierarchy-based priority
 */
export const resolveUserEmail = async (userId: string, schoolId: string): Promise<EmailResolutionResult | null> => {
  try {
    // First, get ALL job assignments for this user with email addresses
    const { data: userJobs, error: userJobsError } = await supabase
      .from('job_board')
      .select(`
        id,
        role,
        email_address,
        reports_to,
        assistant,
        cadet_id,
        school_id,
        created_at,
        updated_at,
        reports_to_source_handle,
        reports_to_target_handle,
        assistant_source_handle,
        assistant_target_handle,
        cadet:profiles!job_board_cadet_id_fkey(
          id,
          first_name,
          last_name,
          rank,
          grade
        )
      `)
      .eq('cadet_id', userId)
      .eq('school_id', schoolId)
      .not('email_address', 'is', null)
      .neq('email_address', '');

    if (userJobsError) {
      console.error('Error fetching user jobs:', userJobsError);
    }

    // If user has job assignments with emails, determine priority based on hierarchy
    if (userJobs && userJobs.length > 0) {
      const jobsWithCadet = userJobs as JobBoardWithCadet[];
      
      // If only one job, use that email
      if (jobsWithCadet.length === 1) {
        return {
          email: jobsWithCadet[0].email_address!,
          source: 'job_board'
        };
      }

      // Multiple jobs - need to determine hierarchy priority
      // Get all jobs in the school to build complete hierarchy
      const { data: allJobs, error: allJobsError } = await supabase
        .from('job_board')
        .select(`
          id,
          role,
          email_address,
          reports_to,
          assistant,
          cadet_id,
          school_id,
          created_at,
          updated_at,
          reports_to_source_handle,
          reports_to_target_handle,
          assistant_source_handle,
          assistant_target_handle,
          cadet:profiles!job_board_cadet_id_fkey(
            id,
            first_name,
            last_name,
            rank,
            grade
          )
        `)
        .eq('school_id', schoolId);

      if (allJobsError) {
        console.error('Error fetching all jobs for hierarchy:', allJobsError);
        // Fall back to first job with email if hierarchy build fails
        return {
          email: jobsWithCadet[0].email_address!,
          source: 'job_board'
        };
      }

      const allJobsWithCadet = allJobs as JobBoardWithCadet[];
      const hierarchy = buildJobHierarchy(allJobsWithCadet);

      // Find the user's job with the lowest level (highest hierarchy position)
      let highestPriorityJob: JobBoardWithCadet | null = null;
      let lowestLevel = Infinity;

      for (const job of jobsWithCadet) {
        const hierarchyNode = hierarchy.nodes.get(job.id);
        if (hierarchyNode && hierarchyNode.level < lowestLevel) {
          lowestLevel = hierarchyNode.level;
          highestPriorityJob = job;
        }
      }

      if (highestPriorityJob) {
        return {
          email: highestPriorityJob.email_address!,
          source: 'job_board'
        };
      }

      // Fallback to first job if hierarchy calculation fails
      return {
        email: jobsWithCadet[0].email_address!,
        source: 'job_board'
      };
    }

    // No job assignments with emails, fall back to profile email
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