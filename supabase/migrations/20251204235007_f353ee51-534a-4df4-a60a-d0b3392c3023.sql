-- Add app_access JSONB column to schools table
ALTER TABLE public.schools
ADD COLUMN app_access jsonb DEFAULT jsonb_build_object(
  'ccc', jsonb_build_object('access', false),
  'competition', jsonb_build_object('tier', 'none')
);

-- Migrate existing boolean flags to the new app_access structure
UPDATE public.schools SET app_access = jsonb_build_object(
  'ccc', jsonb_build_object('access', COALESCE(ccc_portal, false)),
  'competition', jsonb_build_object('tier', 
    CASE 
      WHEN comp_hosting = true THEN 'host'
      WHEN comp_analytics = true THEN 'analytics'
      WHEN comp_basic = true THEN 'basic'
      ELSE 'none'
    END
  )
);

-- Add comment for documentation
COMMENT ON COLUMN public.schools.app_access IS 'JSON structure for app access: { ccc: { access: boolean }, competition: { tier: "none" | "basic" | "analytics" | "host" } }';