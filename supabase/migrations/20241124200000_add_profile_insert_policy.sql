-- Add policy for profile creation
CREATE POLICY "Users can create their own profile"
ON "public"."profiles"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also ensure profiles can be created during signup
CREATE POLICY "Service role can create profiles"
ON "public"."profiles"
FOR INSERT
TO service_role
WITH CHECK (true);
