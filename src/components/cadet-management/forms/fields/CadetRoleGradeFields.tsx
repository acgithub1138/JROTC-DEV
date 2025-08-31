import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { CadetFormData } from '../schemas/cadetFormSchema';
import { useCadetRoles } from '@/hooks/useCadetRoles';
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { gradeOptions, flightOptions, cadetYearOptions } from '../../constants';
import { generateYearOptions } from '@/utils/yearOptions';
import { calculateGrade, shouldAutoCalculateGrade } from '@/utils/gradeCalculation';

interface CadetRoleGradeFieldsProps {
  form: UseFormReturn<CadetFormData>;
  mode: 'create' | 'edit';
}

export const CadetRoleGradeFields: React.FC<CadetRoleGradeFieldsProps> = ({
  form,
  mode
}) => {
  const { userProfile } = useAuth();
  const { roleOptions } = useCadetRoles();
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);

  return (
    <div className="space-y-4">
      {/* Role Selection */}
      <FormField
        control={form.control}
        name="role_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No role selected</SelectItem>
                {roleOptions.map(roleOption => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Academic Information - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="start_year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Freshman Year</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  const freshmanYear = value ? parseInt(value) : undefined;
                  
                  // Auto-calculate grade if freshman year is selected
                  if (shouldAutoCalculateGrade(freshmanYear)) {
                    form.setValue('grade', calculateGrade(freshmanYear));
                  }
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No start year selected</SelectItem>
                  {generateYearOptions().map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => {
            const startYear = form.watch('start_year');
            const freshmanYear = startYear ? parseInt(startYear) : undefined;
            const isAutoCalculated = shouldAutoCalculateGrade(freshmanYear);
            
            return (
              <FormItem>
                <FormLabel>
                  Grade {isAutoCalculated && "(Auto-calculated)"}
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  disabled={isAutoCalculated}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No grade selected</SelectItem>
                    {gradeOptions.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      {/* JROTC Information - Three Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="flight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flight</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flight" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No flight selected</SelectItem>
                  {flightOptions.map(flight => (
                    <SelectItem key={flight} value={flight}>
                      {flight}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cadet_year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cadet Year</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No year selected</SelectItem>
                  {cadetYearOptions.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No rank</SelectItem>
                  {ranks.map(rank => (
                    <SelectItem 
                      key={rank.id} 
                      value={rank.abbreviation ? `${rank.rank} (${rank.abbreviation})` : rank.rank || 'none'}
                    >
                      {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};