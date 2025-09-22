import { supabase } from '@/integrations/supabase/client';
import { generateSecurePassword } from '@/lib/password-utils';
import { toast } from 'sonner';

/**
 * Generates and assigns temporary passwords to cadets that don't have them
 */
export const fixMissingPasswords = async () => {
  try {
    // Find all cadets without temporary passwords
    const { data: cadetsWithoutPasswords, error: fetchError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .or('temp_pswd.is.null,temp_pswd.eq.');

    if (fetchError) {
      console.error('Error fetching cadets without passwords:', fetchError);
      throw fetchError;
    }

    if (!cadetsWithoutPasswords || cadetsWithoutPasswords.length === 0) {
      toast.info('All cadets already have temporary passwords');
      return { success: 0, errors: [] };
    }

    console.log(`Found ${cadetsWithoutPasswords.length} cadets without passwords`);
    
    let successCount = 0;
    const errors: string[] = [];

    // Generate passwords for each cadet
    for (const cadet of cadetsWithoutPasswords) {
      try {
        const tempPassword = generateSecurePassword(12);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ temp_pswd: tempPassword })
          .eq('id', cadet.id);

        if (updateError) {
          console.error(`Error updating password for ${cadet.first_name} ${cadet.last_name}:`, updateError);
          errors.push(`Failed to update password for ${cadet.first_name} ${cadet.last_name}: ${updateError.message}`);
        } else {
          successCount++;
          console.log(`Generated password for ${cadet.first_name} ${cadet.last_name}`);
        }
      } catch (error) {
        console.error(`Error processing ${cadet.first_name} ${cadet.last_name}:`, error);
        errors.push(`Failed to process ${cadet.first_name} ${cadet.last_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Show results
    if (successCount > 0) {
      toast.success(`Generated temporary passwords for ${successCount} cadets`);
    }
    
    if (errors.length > 0) {
      toast.error(`Failed to generate passwords for ${errors.length} cadets`);
      console.error('Password generation errors:', errors);
    }

    return { success: successCount, errors };
  } catch (error) {
    console.error('Error in fixMissingPasswords:', error);
    toast.error('Failed to fix missing passwords');
    throw error;
  }
};