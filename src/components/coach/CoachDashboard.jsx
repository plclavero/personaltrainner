import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { ExerciseManager } from './ExerciseManager';
import { StudentManager } from './StudentManager';
import { RoutineBuilder } from './RoutineBuilder';
import { ProfileSettings } from '../common/ProfileSettings';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Users, Video, LogOut, LayoutDashboard, ChevronRight, Settings, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const CoachDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Mis Alumnos', icon: Users },
    { id: 'exercises', label: 'Biblioteca', icon: Video },
    { id: 'settings', label: 'Mi Perfil', icon: Settings },
  ];

  if (selectedStudent) {
    return <main style={{ padding: 'var(--space-xl)' }}><RoutineBuilder student={selectedStudent} onBack={() => setSelectedStudent(null)} /></main>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-main)' }}>
      {/* Premium Sidebar */}
      <aside className="glass-effect" style={{ 
        width: '280px', 
        background: 'var(--color-primary)', 
        color: 'white',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        borderRight: 'none',
        borderRadius: '0 32px 32px 0'
      }}>
        <div style={{ marginBottom: '3rem', padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--grad-premium)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} color="white" />
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.25rem', margin: 0 }}>Profe Panel</h2>
            <p style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: '0.05em' }}>{user.email.split('@')[0].toUpperCase()}</p>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-main)',
                background: activeTab === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: activeTab === item.id ? 'white' : 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left',
                marginBottom: 'var(--space-xs)',
                transition: 'var(--transition)'
              }}
            >
              <item.icon size={20} />
              <span style={{ fontWeight: 500 }}>{item.label}</span>
              {activeTab === item.id && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </nav>

        <Button 
          onClick={() => supabase.auth.signOut()}
          variant="secondary" 
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#fca5a5',
            marginTop: 'auto'
          }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </Button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 'var(--space-xl)' }}>
        <header style={{ marginBottom: 'var(--space-xl)' }}>
           <h1 style={{ fontSize: '1.875rem' }}>
            {menuItems.find(i => i.id === activeTab).label}
           </h1>
        </header>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <Card style={{ border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ background: '#e0e7ff', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                  <Users size={24} />
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>ALUMNOS</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'Outfit' }}>...</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '1rem', lineHeight: 1.5 }}>
                Atletas bajo tu supervisión. Sigue su progreso diario.
              </p>
            </Card>
            <Card style={{ border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f5f3ff', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                  <Video size={24} />
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>BIBLIOTECA</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'Outfit' }}>...</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '1rem', lineHeight: 1.5 }}>
                Ejercicios grabados y listos para asignar.
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'students' && <StudentManager onSelectStudent={(s) => setSelectedStudent(s)} />}

        {activeTab === 'exercises' && <ExerciseManager />}

        {activeTab === 'settings' && <ProfileSettings onSave={() => setActiveTab('dashboard')} />}
      </main>
    </div>
  );
};
