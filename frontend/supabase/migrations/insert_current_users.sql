-- Insert profiles for existing users
INSERT INTO public.profiles (id, email, name)
SELECT 
    id,
    email,
    raw_user_meta_data->>'name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
