import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from 'use-debounce';

interface EmailValidationResult {
  isChecking: boolean;
  exists: boolean | null;
  error: string | null;
}

export const useEmailValidation = (email: string, enabled: boolean = true) => {
  const [result, setResult] = useState<EmailValidationResult>({
    isChecking: false,
    exists: null,
    error: null
  });

  // Debounce the email to avoid excessive API calls
  const [debouncedEmail] = useDebounce(email, 500);

  useEffect(() => {
    if (!enabled || !debouncedEmail || debouncedEmail.length < 3) {
      setResult({ isChecking: false, exists: null, error: null });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(debouncedEmail)) {
      setResult({ isChecking: false, exists: null, error: null });
      return;
    }

    const checkEmail = async () => {
      setResult(prev => ({ ...prev, isChecking: true, error: null }));

      try {
        const { data, error } = await supabase.rpc('verify_cadet_email_exists', {
          email_param: debouncedEmail
        });

        if (error) {
          console.error('Email validation error:', error);
          setResult({
            isChecking: false,
            exists: null,
            error: 'Failed to validate email'
          });
          return;
        }

        setResult({
          isChecking: false,
          exists: data,
          error: null
        });
      } catch (error) {
        console.error('Email validation error:', error);
        setResult({
          isChecking: false,
          exists: null,
          error: 'Failed to validate email'
        });
      }
    };

    checkEmail();
  }, [debouncedEmail, enabled]);

  return result;
};