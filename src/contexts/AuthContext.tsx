import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
}

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Database['public']['Enums']['user_role'];
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
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string) => {
    // Prevent multiple simultaneous calls
    if (isProfileLoading) return;
    setIsProfileLoading(true);
    try {
      console.log('Fetching user profile for:', userId);

      const { data, error } = await supabase
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
            competition_portal
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        if (error.code !== 'PGRST116') {
          toast({
            title: "Profile Error",
            description: error.message,
            variant: "destructive",
          });
        }
        setIsProfileLoading(false);
        return;
      }

      if (data) {
        console.log('User profile fetched successfully:', {
          id: data.id,
          role: data.role,
          school_id: data.school_id,
          email: data.email
        });
        setUserProfile(data as unknown as Profile);
      } else {
        console.log('No profile found for user:', userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let lastFetchedUserId: string | null = null;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only fetch if we haven't fetched for this user yet
          if (lastFetchedUserId !== session.user.id) {
            lastFetchedUserId = session.user.id;
            fetchUserProfile(session.user.id);
          }
        } else {
          setUserProfile(null);
          lastFetchedUserId = null;
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
      
      if (session?.user && lastFetchedUserId !== session.user.id) {
        lastFetchedUserId = session.user.id;
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
        toast({
          title: "User creation failed",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
        return { error };
      }

      if (data?.error) {
        toast({
          title: "User creation failed",
          description: data.error,
          variant: "destructive",
        });
        return { error: data.error };
      }

      toast({
        title: "Success",
        description: "User created successfully and can now log in.",
      });

      return { error: null };
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
