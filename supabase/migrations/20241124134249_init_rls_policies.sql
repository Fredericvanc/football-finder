-- First drop existing policies
DROP POLICY IF EXISTS "Games are viewable by everyone" ON "public"."games";
DROP POLICY IF EXISTS "Users can create games" ON "public"."games";
DROP POLICY IF EXISTS "Users can update own games" ON "public"."games";
DROP POLICY IF EXISTS "Users can delete own games" ON "public"."games";
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";

-- Enable RLS on tables
ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Games are viewable by everyone"
ON "public"."games"
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create games"
ON "public"."games"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own games"
ON "public"."games"
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete own games"
ON "public"."games"
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
ON "public"."profiles"
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update own profile"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);