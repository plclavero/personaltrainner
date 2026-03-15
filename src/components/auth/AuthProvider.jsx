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
    console.log("👤 Auth Change - User:", user?.email);
    if (user) {
      setUser(user);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log("🎭 Role Fetched:", data?.role, "Error:", error);
        setRole(data?.role ?? 'student');
      } catch (e) {
        console.error("❌ Error fetching role:", e);
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
