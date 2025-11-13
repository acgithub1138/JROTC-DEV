import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

interface School {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  jrotc_program?: string;
  competition_module?: boolean;
  competition_portal?: boolean;
  comp_register_only?: boolean;
  logo_url?: string;
  initials?: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_id?: string;
  school_id: string;
  phone?: string;
  rank?: string;
  password_change_required?: boolean;
  schools?: School;
  user_roles?: {
    role_name: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: Profile | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  // Impersonation
  impersonatedProfile: Profile | null;
  isImpersonating: boolean;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use refs to prevent unnecessary profile fetches
  const profileFetchingRef = useRef<boolean>(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    // Prevent duplicate profile fetches
    if (profileFetchingRef.current || lastFetchedUserIdRef.current === userId) {
      console.log('Skipping profile fetch - already fetching or same user:', userId);
      return null;
    }

    profileFetchingRef.current = true;
    lastFetchedUserIdRef.current = userId;

    try {
      console.log('Fetching user profile for:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          schools (
            id,
            name,
            contact,
            address,
            city,
            state,
            zip_code,
            phone,
            email,
            jrotc_program,
            competition_module,
            competition_portal,
            logo_url,
            initials
          ),
          user_roles (
            role_name
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        if (error.code !== 'PGRST116') {
          toast("Profile Error", { description: error.message });
        }
        return null;
      }

      console.log('User profile fetched successfully:', profile);
      return profile as Profile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    } finally {
      profileFetchingRef.current = false;
    }
  }, []);

  // Track redirected users to prevent infinite redirects
  const redirectedUserRef = useRef<string | null>(null);

  const handleExternalUserRedirect = useCallback((profile: Profile) => {
    // Get the role from either user_roles or fallback to profile.role
    const userRole = profile.user_roles?.role_name || profile.role;
    
    console.log('handleExternalUserRedirect - userRole:', userRole, 'profile.id:', profile.id);
    
    // Check if user has external role and hasn't been redirected yet
    // Also check current location to prevent redirect loops
    const currentPath = window.location.pathname;
    
    // IMPORTANT: Only redirect external users if school has comp_register_only set to true
    if (userRole === 'external' && 
        profile.schools?.comp_register_only === true &&
        redirectedUserRef.current !== profile.id && 
        !currentPath.includes('/app/competition-portal/open-competitions')) {
      redirectedUserRef.current = profile.id;
      console.log('Redirecting external user to competition portal from:', currentPath);
      
      // Use setTimeout to prevent redirect loops during auth state changes
      setTimeout(() => {
        window.location.href = '/app/competition-portal/open-competitions';
      }, 100);
    } else {
      console.log('No redirect needed for user role:', userRole, 'comp_register_only:', profile.schools?.comp_register_only);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider useEffect mounting');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) {
          console.log('Component unmounted, ignoring auth state change');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && session.user.id !== lastFetchedUserIdRef.current) {
          console.log('Need to fetch profile for new user:', session.user.id);
          // Defer profile fetching to avoid blocking auth state changes
          setTimeout(async () => {
            if (mounted) {
              const profile = await fetchUserProfile(session.user.id);
              if (profile && mounted) {
                setUserProfile(profile);
                // Only redirect on SIGNED_IN event to prevent loops
                if (event === 'SIGNED_IN') {
                  handleExternalUserRedirect(profile);
                }
              }
              setLoading(false);
            }
          }, 0);
        } else if (!session?.user) {
          console.log('No user session, clearing profile');
          setUserProfile(null);
          lastFetchedUserIdRef.current = null;
          profileFetchingRef.current = false;
          redirectedUserRef.current = null; // Reset redirect tracking
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) {
        console.log('Component unmounted, ignoring initial session');
        return;
      }
      
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && lastFetchedUserIdRef.current !== session.user.id) {
        console.log('Initial session - need to fetch profile');
        setTimeout(async () => {
          if (mounted) {
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              setUserProfile(profile);
              // Don't redirect on initial session check to prevent loops
            }
            setLoading(false);
          }
        }, 0);
      } else {
        console.log('Initial session - no profile fetch needed');
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider useEffect cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, handleExternalUserRedirect]);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        toast("Sign up failed", { description: error.message });
      } else {
        toast("Success", { description: "Please check your email to confirm your account" });
      }

      return { error };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast("Sign in failed", { description: error.message });
      }

      return { error };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear impersonation state
      sessionStorage.removeItem('impersonation_active');
      sessionStorage.removeItem('impersonated_user_id');
      sessionStorage.removeItem('original_admin_id');
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setImpersonatedProfile(null);
      lastFetchedUserIdRef.current = null;
      profileFetchingRef.current = false;
      window.location.href = '/app/user-type';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const createUser = useCallback(async (email: string, password: string, userData?: any) => {
    try {
      // Call the edge function to create the user
      const { data, error } = await supabase.functions.invoke('create-cadet-user', {
        body: {
          email,
          password, // Pass the actual password
          first_name: userData?.first_name,
          last_name: userData?.last_name,
          role: userData?.role,
          school_id: userData?.school_id,
          grade: userData?.grade,
          rank: userData?.rank,
          flight: userData?.flight,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast("User creation failed", { description: error.message || "Failed to create user" });
        return { error };
      }

      if (data?.error) {
        toast("User creation failed", { description: data.error });
        return { error: data.error };
      }

      toast("Success", { description: "User created successfully and can now log in." });
      return { error: null };
    } catch (error: any) {
      console.error('User creation error:', error);
      toast("Error", { description: "Failed to create user" });
      return { error };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    // Reset the ref to allow a new fetch
    lastFetchedUserIdRef.current = null;
    profileFetchingRef.current = false;
    
    const profile = await fetchUserProfile(user.id);
    if (profile) {
      setUserProfile(profile);
    }
  }, [user?.id, fetchUserProfile]);

  // Impersonation functions
  const startImpersonation = useCallback(async (userId: string) => {
    if (!userProfile || userProfile.role !== 'admin') {
      toast('Unauthorized', { description: 'Only admins can impersonate users' });
      return;
    }

    try {
      console.log('Starting impersonation for user:', userId);
      const profile = await fetchUserProfile(userId);
      
      if (!profile) {
        toast('Error', { description: 'Failed to load user profile' });
        return;
      }

      // Store impersonation state in sessionStorage
      sessionStorage.setItem('impersonation_active', 'true');
      sessionStorage.setItem('impersonated_user_id', userId);
      sessionStorage.setItem('original_admin_id', userProfile.id);
      
      setImpersonatedProfile(profile);
      toast('Impersonation Active', { 
        description: `Now viewing as ${profile.first_name} ${profile.last_name}` 
      });
      
      // Refresh to apply all permissions
      window.location.reload();
    } catch (error) {
      console.error('Impersonation error:', error);
      toast('Error', { description: 'Failed to impersonate user' });
    }
  }, [userProfile, fetchUserProfile]);

  const stopImpersonation = useCallback(() => {
    console.log('Stopping impersonation');
    
    // Clear sessionStorage
    sessionStorage.removeItem('impersonation_active');
    sessionStorage.removeItem('impersonated_user_id');
    sessionStorage.removeItem('original_admin_id');
    
    setImpersonatedProfile(null);
    toast('Impersonation Ended', { 
      description: 'Returned to admin view' 
    });
    
    // Refresh to restore admin permissions
    window.location.reload();
  }, []);

  // Check for existing impersonation on mount
  useEffect(() => {
    const checkImpersonation = async () => {
      const isImpersonating = sessionStorage.getItem('impersonation_active') === 'true';
      const impersonatedUserId = sessionStorage.getItem('impersonated_user_id');
      const originalAdminId = sessionStorage.getItem('original_admin_id');

      if (isImpersonating && impersonatedUserId && originalAdminId && userProfile) {
        // Verify current user is still the admin
        if (userProfile.id === originalAdminId && userProfile.role === 'admin') {
          console.log('Restoring impersonation state for:', impersonatedUserId);
          const profile = await fetchUserProfile(impersonatedUserId);
          if (profile) {
            setImpersonatedProfile(profile);
          }
        } else {
          // Clear invalid impersonation state
          sessionStorage.removeItem('impersonation_active');
          sessionStorage.removeItem('impersonated_user_id');
          sessionStorage.removeItem('original_admin_id');
        }
      }
    };

    if (userProfile && !loading) {
      checkImpersonation();
    }
  }, [userProfile, loading, fetchUserProfile]);

  const value = useMemo(() => ({
    user,
    session,
    userProfile: impersonatedProfile || userProfile, // Return impersonated profile if active
    loading,
    signUp,
    signIn,
    signOut,
    createUser,
    refreshProfile,
    impersonatedProfile,
    isImpersonating: !!impersonatedProfile,
    startImpersonation,
    stopImpersonation,
  }), [user, session, userProfile, impersonatedProfile, loading, signUp, signIn, signOut, createUser, refreshProfile, startImpersonation, stopImpersonation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
