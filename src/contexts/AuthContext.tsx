import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface School {
  id: string;
  name: string;
  district?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  jrotc_program?: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'instructor' | 'command_staff' | 'cadet' | 'parent';
  school_id: string;
  phone?: string;
  rank?: string;
  password_change_required?: boolean;
  schools?: School;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: Profile | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    try {
      console.log('Fetching user profile for:', userId, 'Retry:', retryCount);
      
      // Debug session context before making query
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session before profile query:', {
        userId: currentSession?.user?.id,
        accessToken: currentSession?.access_token ? 'present' : 'missing',
        refreshToken: currentSession?.refresh_token ? 'present' : 'missing',
        expiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000) : 'unknown'
      });

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          schools (
            id,
            name,
            district,
            address,
            city,
            state,
            zip_code,
            phone,
            email,
            jrotc_program
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Check if this is a JWT/auth context error and retry
        if (error.message?.includes('JWT') || error.code === 'PGRST301' || retryCount < 2) {
          console.log('Potential JWT context issue detected, attempting session refresh...');
          
          try {
            // Force refresh the session
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshData.session && !refreshError && retryCount < 2) {
              console.log('Session refreshed, retrying profile fetch...');
              // Update session state immediately
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              
              // Retry profile fetch with new session
              setTimeout(() => fetchUserProfile(userId, retryCount + 1), 100);
              return;
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
          }
        }
        
        // Don't show toast for missing profile, just log it
        if (error.code !== 'PGRST116') {
          toast({
            title: "Profile Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data) {
        console.log('User profile fetched:', data);
        console.log('School JROTC Program:', data.schools?.jrotc_program);
        setUserProfile(data);
      } else {
        console.log('No profile found for user:', userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer the profile fetch and avoid blocking
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id);
            }
          }, 0);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
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
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Please check your email to confirm your account",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const createUser = async (email: string, password: string, userData?: any) => {
    try {
      // For regular users, we can only use the standard signUp method
      // Admin functions require service role which regular users don't have
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
        toast({
          title: "User creation failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User created successfully. They will need to check their email to confirm their account.",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('User creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    signUp,
    signIn,
    signOut,
    createUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
