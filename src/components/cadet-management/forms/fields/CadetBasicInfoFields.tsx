import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { CadetFormData } from '../schemas/cadetFormSchema';
import { useEmailValidation } from '@/hooks/useEmailValidation';

interface CadetBasicInfoFieldsProps {
  form: UseFormReturn<CadetFormData>;
  mode: 'create' | 'edit';
}

export const CadetBasicInfoFields: React.FC<CadetBasicInfoFieldsProps> = ({
  form,
  mode
}) => {
  const emailValue = form.watch('email');
  
  // Email validation hook - only check in create mode
  const { isChecking: isCheckingEmail, exists: emailExists, error: emailError } = useEmailValidation(
    emailValue,
    mode === 'create' && emailValue.length > 0
  );

  return (
    <div className="space-y-4">
      {/* First Name and Last Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <FormLabel className="md:w-24 md:text-right flex-shrink-0">
                First Name <span className="text-destructive">*</span>
              </FormLabel>
              <div className="flex-1">
                <FormControl>
                  <Input 
                    placeholder="Enter first name" 
                    {...field} 
                    disabled={mode === 'edit'} // Disable editing names in edit mode
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <FormLabel className="md:w-24 md:text-right flex-shrink-0">
                Last Name <span className="text-destructive">*</span>
              </FormLabel>
              <div className="flex-1">
                <FormControl>
                  <Input 
                    placeholder="Enter last name" 
                    {...field} 
                    disabled={mode === 'edit'} // Disable editing names in edit mode
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Email Row */}
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <FormLabel className="md:w-24 md:text-right flex-shrink-0">
              Email <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex-1">
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter email address" 
                  {...field} 
                  disabled={mode === 'edit'} // Disable editing email in edit mode
                />
              </FormControl>
              <FormMessage />
              {/* Real-time email validation feedback */}
              {mode === 'create' && field.value && (
                <>
                  {isCheckingEmail && (
                    <p className="text-sm text-muted-foreground mt-1">Checking email...</p>
                  )}
                  {!isCheckingEmail && emailExists === false && (
                    <p className="text-sm text-emerald-600 mt-1">✓ Email is available</p>
                  )}
                  {!isCheckingEmail && emailExists === true && (
                    <p className="text-sm text-destructive mt-1">⚠ This email address is already registered</p>
                  )}
                  {emailError && (
                    <p className="text-sm text-destructive mt-1">{emailError}</p>
                  )}
                </>
              )}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};