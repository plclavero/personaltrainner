import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUser = async (user) => {
    if (user) {
      setUser(user);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role, first_name, last_name, phone')
          .eq('id', user.id)
          .single();
        
        setRole(data?.role ?? 'student');
        setUser({ ...user, ...data }); // Enriquecer objeto user con datos de perfil
      } catch (e) {
        setRole('student');
      }
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
