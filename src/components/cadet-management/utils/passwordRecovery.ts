import { supabase } from "@/integrations/supabase/client";
import { generateSecurePassword } from "@/lib/password-utils";

export interface CadetPasswordIssue {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  has_metadata_password: boolean;
  metadata_password?: string;
}

/**
 * Find all cadets missing temp_pswd field
 */
export async function findCadetsWithMissingPasswords(): Promise<CadetPasswordIssue[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .is('temp_pswd', null)
    .eq('password_change_required', false);

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  const cadetsWithIssues: CadetPasswordIssue[] = [];

  // Check each profile for generated_password in auth metadata
  for (const profile of profiles) {
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
      
      if (userError) {
        console.warn(`Could not fetch user data for ${profile.id}:`, userError);
        cadetsWithIssues.push({
          ...profile,
          has_metadata_password: false
        });
        continue;
      }

      const generatedPassword = userData.user?.user_metadata?.generated_password;
      
      cadetsWithIssues.push({
        ...profile,
        has_metadata_password: !!generatedPassword,
        metadata_password: generatedPassword
      });
    } catch (error) {
      console.warn(`Error checking metadata for ${profile.id}:`, error);
      cadetsWithIssues.push({
        ...profile,
        has_metadata_password: false
      });
    }
  }

  return cadetsWithIssues;
}

/**
 * Fix a single cadet's password by recovering from metadata or generating new
 */
export async function fixCadetPassword(cadet: CadetPasswordIssue): Promise<void> {
  let passwordToUse = cadet.metadata_password;

  // If no password in metadata, generate a new one
  if (!passwordToUse) {
    passwordToUse = generateSecurePassword(12);
    
    // Update user metadata with the new password
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      cadet.id,
      {
        user_metadata: {
          generated_password: passwordToUse
        }
      }
    );

    if (metadataError) {
      throw new Error(`Failed to update user metadata: ${metadataError.message}`);
    }
  }

  // Update the profile with the password
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      temp_pswd: passwordToUse,
      password_change_required: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', cadet.id);

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }
}

/**
 * Fix all cadets with missing passwords
 */
export async function fixAllCadetsWithMissingPasswords(): Promise<{ fixed: number; failed: number; errors: string[] }> {
  const cadetsWithIssues = await findCadetsWithMissingPasswords();
  
  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const cadet of cadetsWithIssues) {
    try {
      await fixCadetPassword(cadet);
      fixed++;
    } catch (error) {
      failed++;
      const errorMessage = `${cadet.first_name} ${cadet.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(`Failed to fix password for ${cadet.email}:`, error);
    }
  }

  return { fixed, failed, errors };
}