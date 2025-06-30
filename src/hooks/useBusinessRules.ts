
import { useBusinessRulesQuery } from './business-rules/useBusinessRulesQuery';
import { useBusinessRuleMutations } from './business-rules/useBusinessRuleMutations';

export type { BusinessRule } from './business-rules/types';

export const useBusinessRules = () => {
  const { rules, loading, fetchRules, setRules } = useBusinessRulesQuery();
  const mutations = useBusinessRuleMutations(setRules);

  return {
    rules,
    loading,
    refetch: fetchRules,
    ...mutations,
  };
};
