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
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<string, number> = {
  'admin': 100,
  'instructor': 80,
  'command_staff': 60,
  'cadet': 40,
  'parent': 20
}

/**
 * Checks if user has minimum required role level
 */
export function hasMinimumRole(userRole: string, minimumRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0
  return userLevel >= requiredLevel
}

/**
 * Checks if user can perform action on target user based on role hierarchy
 */
export function canActOnUser(actorRole: string, targetRole: string): boolean {
  const actorLevel = ROLE_HIERARCHY[actorRole] || 0
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0
  return actorLevel > targetLevel
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
 * Validates user has minimum role level
 */
export function requireMinimumRole(profile: UserProfile, minimumRole: string): void {
  if (!hasMinimumRole(profile.role, minimumRole)) {
    throw new AuthorizationError(`Access denied. Minimum role required: ${minimumRole}. Current role: ${profile.role}`)
  }
}

/**
 * Validates user can act on target user (role hierarchy check)
 */
export function requireCanActOnUser(actorProfile: UserProfile, targetRole: string): void {
  if (!canActOnUser(actorProfile.role, targetRole)) {
    throw new AuthorizationError(`Insufficient permissions to perform this action on a ${targetRole}`)
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
  // Only admins and instructors can create users
  requireMinimumRole(actorProfile, 'instructor')
  
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
  
  // Instructors cannot create admin_only roles
  if (actorProfile.role === 'instructor' && roleData.admin_only) {
    throw new AuthorizationError(`Cannot create users with admin-only roles: ${targetRole}`)
  }
}

/**
 * Validates user can reset password for target user
 */
export function requireCanResetPassword(actorProfile: UserProfile, targetProfile: UserProfile): void {
  // Users cannot reset their own password through this function
  if (actorProfile.id === targetProfile.id) {
    throw new AuthorizationError('Cannot reset your own password through this function')
  }

  // Check minimum role requirement
  requireMinimumRole(actorProfile, 'instructor')

  // Check school requirement for non-admins
  requireSameSchool(actorProfile, targetProfile.school_id)

  // Check role hierarchy
  requireCanActOnUser(actorProfile, targetProfile.role)
}

/**
 * Validates user can toggle status for target user
 */
export function requireCanToggleUserStatus(actorProfile: UserProfile, targetProfile: UserProfile): void {
  // Users cannot toggle their own status
  if (actorProfile.id === targetProfile.id) {
    throw new AuthorizationError('Cannot toggle your own account status')
  }

  // Check minimum role requirement
  requireMinimumRole(actorProfile, 'instructor')

  // Check school requirement for non-admins
  requireSameSchool(actorProfile, targetProfile.school_id)

  // Check role hierarchy
  requireCanActOnUser(actorProfile, targetProfile.role)
}