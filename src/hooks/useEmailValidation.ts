import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmailValidationState {
  isChecking: boolean;
  exists: boolean | null;
  error: string | null;
}

export const useEmailValidation = (email: string, shouldCheck: boolean = true) => {
  const { userProfile } = useAuth();
  const [validationState, setValidationState] = useState<EmailValidationState>({
    isChecking: false,
    exists: null,
    error: null
  });

  // Debounce email input to avoid excessive API calls
  const [debouncedEmail] = useDebounce(email, 500);

  useEffect(() => {
    // Only validate when shouldCheck is true and email is provided
    if (!shouldCheck || !debouncedEmail) {
      setValidationState({
        isChecking: false,
        exists: null,
        error: null
      });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(debouncedEmail)) {
      setValidationState({
        isChecking: false,
        exists: null,
        error: null
      });
      return;
    }

    const checkEmailAvailability = async () => {
      setValidationState(prev => ({ ...prev, isChecking: true, error: null }));

      try {
        // Check if email already exists in profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, active')
          .eq('email', debouncedEmail)
          .eq('school_id', userProfile?.school_id)
          .maybeSingle();

        if (error) {
          console.error('Email validation error:', error);
          setValidationState({
            isChecking: false,
            exists: null,
            error: 'Unable to verify email availability'
          });
          return;
        }

        if (data) {
          // Email already exists
          setValidationState({
            isChecking: false,
            exists: true,
            error: null
          });
        } else {
          // Email is available
          setValidationState({
            isChecking: false,
            exists: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Email validation error:', error);
        setValidationState({
          isChecking: false,
          exists: null,
          error: 'Unable to verify email availability'
        });
      }
    };

    checkEmailAvailability();
  }, [debouncedEmail, shouldCheck, userProfile?.school_id]);

  return validationState;
};