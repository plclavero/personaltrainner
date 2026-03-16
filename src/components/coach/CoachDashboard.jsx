import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { ExerciseManager } from './ExerciseManager';
import { StudentManager } from './StudentManager';
import { RoutineBuilder } from './RoutineBuilder';
import { ProfileSettings } from '../common/ProfileSettings';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Users, Video, LogOut, LayoutDashboard, ChevronRight, Settings } from 'lucide-react';
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
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        background: 'var(--color-primary)', 
        color: 'white',
        padding: 'var(--space-xl) var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0
      }}>
        <div style={{ marginBottom: 'var(--space-xl)', padding: '0 var(--space-md)' }}>
          <h2 style={{ color: 'white', fontSize: '1.25rem' }}>Profe Panel</h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{user.email}</p>
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
          <div style={{ display: 'grid', gap: 'var(--space-lg)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Alumnos Activos</span>
                <Users size={20} style={{ color: 'var(--color-accent)' }} />
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 700 }}>...</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-sm)' }}>
                Gestión en tiempo real de tus atletas.
              </p>
            </Card>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Biblioteca</span>
                <Video size={20} style={{ color: 'var(--color-accent)' }} />
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 700 }}>...</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-sm)' }}>
                Videos técnicos sincronizados.
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
