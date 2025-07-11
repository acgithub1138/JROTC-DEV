import { supabase } from '@/integrations/supabase/client';

export class SessionManager {
  private static instance: SessionManager;
  private sessionPromise: Promise<any> | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Ensures a valid session is available before making database queries
   */
  async ensureValidSession(): Promise<any> {
    // Avoid concurrent session refreshes
    if (this.sessionPromise) {
      return this.sessionPromise;
    }

    this.sessionPromise = this.refreshSessionIfNeeded();
    const result = await this.sessionPromise;
    this.sessionPromise = null;
    return result;
  }

  private async refreshSessionIfNeeded(): Promise<any> {
    try {
      // Get current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw sessionError;
      }

      // If no session, try to refresh
      if (!currentSession) {
        console.log('No current session found, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
          throw new Error('Session refresh failed');
        }

        if (!refreshData.session) {
          throw new Error('No session available after refresh');
        }

        console.log('Session refreshed successfully');
        return refreshData.session;
      }

      // Check if session is about to expire (within 1 minute)
      const expiresAt = currentSession.expires_at;
      if (expiresAt && (expiresAt * 1000 - Date.now() < 60000)) {
        console.log('Session about to expire, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.warn('Preemptive session refresh failed:', refreshError);
          // Continue with current session if refresh fails
          return currentSession;
        }

        if (refreshData.session) {
          console.log('Session preemptively refreshed');
          return refreshData.session;
        }
      }

      return currentSession;
    } catch (error) {
      console.error('Session management error:', error);
      throw error;
    }
  }

  /**
   * Validates that the database auth context is working
   */
  async validateAuthContext(): Promise<{ role: string | null; isValid: boolean }> {
    try {
      const validSession = await this.ensureValidSession();
      
      // Make sure the session is attached to the request
      if (validSession?.access_token) {
        // Force the client to use the current session token
        await supabase.auth.setSession({
          access_token: validSession.access_token,
          refresh_token: validSession.refresh_token
        });
      }
      
      const { data: role, error } = await supabase.rpc('get_current_user_role');
      
      if (error) {
        console.error('Auth context validation failed:', error);
        
        // If still failing, try one more time with manual session set
        if (validSession?.access_token) {
          console.log('Retrying with manual session attachment...');
          const retryResult = await supabase.rpc('get_current_user_role');
          if (retryResult.data) {
            console.log('Manual session attachment successful. User role:', retryResult.data);
            return { role: retryResult.data, isValid: true };
          }
        }
        
        return { role: null, isValid: false };
      }

      console.log('Auth context validated. User role:', role);
      return { role, isValid: true };
    } catch (error) {
      console.error('Auth context validation error:', error);
      return { role: null, isValid: false };
    }
  }

  /**
   * Forces a complete session refresh and validation
   */
  async forceSessionRefresh(): Promise<boolean> {
    try {
      console.log('Forcing session refresh...');
      const { data: refreshData, error } = await supabase.auth.refreshSession();
      
      if (error || !refreshData.session) {
        console.error('Force refresh failed:', error);
        return false;
      }

      // Validate the refreshed session
      const { isValid } = await this.validateAuthContext();
      console.log('Force refresh result:', isValid ? 'success' : 'failed');
      
      return isValid;
    } catch (error) {
      console.error('Force refresh error:', error);
      return false;
    }
  }
}

export const sessionManager = SessionManager.getInstance();