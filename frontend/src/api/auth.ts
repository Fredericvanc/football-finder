import { supabase } from '../supabase';
import { User } from '../types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const { data: supabaseData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });

    if (error) throw error;
    if (!supabaseData.user) throw new Error('No user data returned');

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: supabaseData.user.id,
          email: data.email,
          name: data.name,
        },
      ]);

    if (profileError) throw profileError;

    return {
      user: {
        id: supabaseData.user.id,
        email: supabaseData.user.email!,
        name: data.name || null,
      },
      token: supabaseData.session?.access_token || '',
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const { data: supabaseData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    if (!supabaseData.user) throw new Error('No user data returned');

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseData.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      user: {
        id: supabaseData.user.id,
        email: supabaseData.user.email!,
        name: profileData.name,
      },
      token: supabaseData.session?.access_token || '',
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getCurrentUser = async (token: string): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return {
      id: user.id,
      email: user.email!,
      name: profileData.name,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};
