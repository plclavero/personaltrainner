import React from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { Login } from './components/auth/Login';
import { ResetPassword } from './components/auth/ResetPassword';
import { CoachDashboard } from './components/coach/CoachDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';

function Main() {
  const { user, role, loading } = useAuth();
  const [isResetting, setIsResetting] = React.useState(false);

  React.useEffect(() => {
    // Supabase recovery links usually come with a type=recovery hash
    if (window.location.hash.includes('type=recovery')) {
      setIsResetting(true);
    }
  }, []);

  if (isResetting) {
    return <ResetPassword onComplete={() => setIsResetting(false)} />;
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--color-bg-main)',
        color: 'var(--color-accent)',
        fontWeight: 600
      }}>
        Cargando plataforma...
      </div>
    );
  }

  if (!user) return <Login />;

  return role === 'trainer' ? <CoachDashboard /> : <StudentDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}