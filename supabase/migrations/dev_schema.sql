-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 10,
    min_players INTEGER NOT NULL DEFAULT 2,
    skill_level TEXT,
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    location_name TEXT,
    whatsapp_link TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_frequency TEXT
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Games policies
CREATE POLICY "Games are viewable by everyone" 
ON games FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create games" 
ON games FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update own games" 
ON games FOR UPDATE 
TO authenticated 
USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own games" 
ON games FOR DELETE 
TO authenticated 
USING (creator_id = auth.uid());

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
