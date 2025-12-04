import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface UserProfile {
  id: string
  role: string
  school_id: string
  active: boolean
}

export interface AuthContext {
  user: any
  profile: UserProfile
  supabaseAdmin: any
}

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Validates JWT token and retrieves user profile with role information
 */
export async function validateAuthentication(req: Request): Promise<AuthContext> {
  // Check for authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No valid authorization header provided')
  }

  // Create admin client
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Verify the JWT token and get user
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    throw new AuthenticationError('Invalid or expired token')
  }

  // Get user profile with role information
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, school_id, active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new AuthenticationError('Unable to retrieve user profile')
  }

  // Check if user account is active
  if (!profile.active) {
    throw new AuthenticationError('User account is inactive')
  }

  return { user, profile, supabaseAdmin }
}

/**
 * Checks user permission using database function
 */
async function checkUserPermission(userId: string, module: string, action: string, supabaseAdmin: any): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('check_user_permission', {
      user_id: userId,
      module_name: module,
      action_name: action
    })

  if (error) {
    console.error('Error checking user permission:', error)
    return false
  }

  return data === true
}

/**
 * Validates user has required role
 */
export function requireRole(profile: UserProfile, requiredRoles: string[]): void {
  if (!requiredRoles.includes(profile.role)) {
    throw new AuthorizationError(`Access denied. Required roles: ${requiredRoles.join(', ')}. Current role: ${profile.role}`)
  }
}


/**
 * Validates users are in the same school (for non-admin users)
 */
export function requireSameSchool(actorProfile: UserProfile, targetSchoolId: string): void {
  if (actorProfile.role !== 'admin' && actorProfile.school_id !== targetSchoolId) {
    throw new AuthorizationError('Access denied. Users must be in the same school')
  }
}

/**
 * Validates user can create users with specified role
 */
export async function requireCanCreateUserWithRole(actorProfile: UserProfile, targetRole: string, supabaseAdmin: any): Promise<void> {
  // Check permission to create users
  const canCreateUsers = await checkUserPermission(actorProfile.id, 'cadets', 'create', supabaseAdmin)
  if (!canCreateUsers) {
    throw new AuthorizationError('Access denied. You do not have permission to create users')
  }
  
  // Admins can create users with any role
  if (actorProfile.role === 'admin') {
    return
  }
  
  // For non-admins, check if the target role is admin_only
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('admin_only')
    .eq('role_name', targetRole)
    .single()
  
  if (roleError) {
    // If role not found in user_roles table, allow (backward compatibility)
    console.warn('Role not found in user_roles table:', targetRole)
    return
  }
  
  // Non-admins cannot create admin_only roles
  if (roleData.admin_only) {
    throw new AuthorizationError(`Cannot create users with admin-only roles: ${targetRole}`)
  }
}

/**
 * Validates user can reset password for target user
 */
export async function requireCanResetPassword(actorProfile: UserProfile, targetProfile: UserProfile, supabaseAdmin: any): Promise<void> {
  // Users cannot reset their own password through this function
  if (actorProfile.id === targetProfile.id) {
    throw new AuthorizationError('Cannot reset your own password through this function')
  }

  // Check permission to reset passwords from either cadets or comp_cadets module
  const canResetFromCadets = await checkUserPermission(actorProfile.id, 'cadets', 'reset_password', supabaseAdmin)
  const canResetFromCompCadets = await checkUserPermission(actorProfile.id, 'comp_cadets', 'reset_password', supabaseAdmin)
  
  if (!canResetFromCadets && !canResetFromCompCadets) {
    throw new AuthorizationError('Access denied. You do not have permission to reset passwords')
  }

  // Check school requirement for non-admins
  requireSameSchool(actorProfile, targetProfile.school_id)
}

/**
 * Validates user can toggle status for target user
 */
export async function requireCanToggleUserStatus(actorProfile: UserProfile, targetProfile: UserProfile, supabaseAdmin: any): Promise<void> {
  // Users cannot toggle their own status
  if (actorProfile.id === targetProfile.id) {
    throw new AuthorizationError('Cannot toggle your own account status')
  }

  // Check permission to delete users (toggle status)
  const canDeleteUsers = await checkUserPermission(actorProfile.id, 'cadets', 'delete', supabaseAdmin)
  if (!canDeleteUsers) {
    throw new AuthorizationError('Access denied. You do not have permission to toggle user status')
  }

  // Check school requirement for non-admins
  requireSameSchool(actorProfile, targetProfile.school_id)
}