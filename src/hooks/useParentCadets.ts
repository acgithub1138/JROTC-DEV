import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ParentCadet {
  id: string;
  name: string;
  cadet_id: string;
  tasks: {
    total: number;
    active: number;
    overdue: number;
    completed: number;
  };
}

export const useParentCadets = () => {
  const { userProfile } = useAuth();
  const [cadets, setCadets] = useState<ParentCadet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentCadets = async () => {
      if (!userProfile?.email || userProfile.role !== 'parent') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get the contacts for this parent user
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, name, cadet_id')
          .eq('email', userProfile.email)
          .eq('type', 'parent')
          .not('cadet_id', 'is', null);

        if (contactsError) {
          console.error('Error fetching parent contacts:', contactsError);
          setError('Failed to fetch cadet information');
          return;
        }

        if (!contacts || contacts.length === 0) {
          setCadets([]);
          return;
        }

        // For now, just show the cadets without task data since we don't have the tasks table schema
        const cadetsData: ParentCadet[] = contacts.map((contact) => ({
          id: contact.id,
          name: contact.name || 'Cadet',
          cadet_id: contact.cadet_id!,
          tasks: {
            total: 0,
            active: 0,
            overdue: 0,
            completed: 0
          }
        }));

        setCadets(cadetsData);

      } catch (err) {
        console.error('Error in fetchParentCadets:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentCadets();
  }, [userProfile?.email, userProfile?.role]);

  return { cadets, isLoading, error };
};