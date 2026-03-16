import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { LogOut, PlayCircle, History, TrendingUp, Clock, ExternalLink, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProfileSettings } from '../common/ProfileSettings';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [routine, setRoutine] = useState([]);
  const [workoutName, setWorkoutName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [debugInfo, setDebugInfo] = useState({ userId: null, routineCount: 0, lastError: null });

  useEffect(() => {
    fetchMyRoutine();
  }, [selectedDate]);

  const fetchMyRoutine = async () => {
    try {
      console.log('🔍 Buscando rutina para ID:', user.id, 'en fecha:', selectedDate);
      const { data: workout, error: wError } = await supabase
        .from('workouts')
        .select('id, name')
        .eq('student_id', user.id)
        .eq('scheduled_date', selectedDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 
      
      if (wError) console.error('❌ Error en workouts:', wError);
      console.log('📄 Workout hallado:', workout);

      if (workout) {
        // 2. Get exercises for this workout
        const { data: workoutExs } = await supabase
          .from('workout_exercises')
          .select(`
            *,
            exercises (
              title,
              yt_video_id
            )
          `)
          .eq('workout_id', workout.id)
          .order('order_index', { ascending: true });
        
        // Filter out items where exercise join might have failed (null defense)
        const validRoutine = (workoutExs || []).filter(item => item.exercises);
        setRoutine(validRoutine);
        setWorkoutName(workout.name);
        setDebugInfo(prev => ({ ...prev, userId: user.id, routineCount: validRoutine.length }));
      } else {
        setDebugInfo(prev => ({ ...prev, userId: user.id, routineCount: 0, lastError: 'No workout found' }));
      }
    } catch (err) {
      console.error('Error fetching routine:', err);
      setDebugInfo(prev => ({ ...prev, userId: user.id, lastError: err.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
      {/* Mobile-friendly Header */}
      <header style={{ 
        background: 'white', 
        padding: 'var(--space-md) var(--space-lg)', 
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Atleta Panel</h2>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', color: 'var(--color-text-muted)' }}>
            <Settings size={20} />
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', color: 'var(--color-text-muted)' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {showSettings ? (
        <main style={{ padding: 'var(--space-lg)' }}>
          <ProfileSettings onSave={() => setShowSettings(false)} onCancel={() => setShowSettings(false)} />
        </main>
      ) : (
        <main style={{ padding: 'var(--space-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
            ¡Hola, {user.first_name || 'Atleta'}! 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
        </div>

        {/* Timeline Selector */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 'var(--space-md)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)', scrollbarWidth: 'none' }}>
          {[-2, -1, 0, 1, 2, 3, 4].map(offset => {
            const date = new Date();
            date.setDate(date.getDate() + offset);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = offset === 0;
            const isSelected = dateStr === selectedDate;
            
            return (
              <button 
                key={offset}
                onClick={() => setSelectedDate(dateStr)}
                style={{ 
                  flex: '0 0 60px', 
                  padding: 'var(--space-sm)', 
                  borderRadius: '12px', 
                  background: isSelected ? 'var(--color-accent)' : 'white',
                  color: isSelected ? 'white' : 'var(--color-text-main)',
                  border: isSelected ? 'none' : '1px solid var(--color-border)',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.8 }}>
                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Routine */}
        <section style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Entrenamiento</h3>
            {workoutName && <span style={{ fontSize: '0.75rem', background: 'var(--color-accent)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>{workoutName}</span>}
          </div>
          
          {loading ? (
             <p>Cargando ejercicios...</p>
          ) : routine.length === 0 ? (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', borderLeft: '4px solid var(--color-border)' }}>
              <div style={{ background: 'rgba(0,0,0,0.05)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-main)' }}>
                <PlayCircle size={24} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '2px' }}>Sin asignación</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No tienes ejercicios para esta fecha.</p>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {routine.map((item) => (
                <Card key={item.id} style={{ padding: '0', overflow: 'hidden', display: 'flex' }}>
                   <div style={{ width: '100px', position: 'relative' }}>
                      <img 
                        src={`https://img.youtube.com/vi/${item.exercises?.yt_video_id}/mqdefault.jpg`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        alt={item.exercises?.title || 'Ejercicio'}
                      />
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <PlayCircle size={24} />
                      </div>
                   </div>
                   <div style={{ flex: 1, padding: 'var(--space-md)' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.exercises?.title || 'Ejercicio sin nombre'}</h4>
                      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.series} series</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{item.reps} reps</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {item.rest_secs}s
                        </span>
                      </div>
                      <a 
                        href={`https://youtube.com/watch?v=${item.exercises?.yt_video_id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '8px', fontWeight: 600 }}
                      >
                         <ExternalLink size={12} /> VER TÉCNICA
                      </a>
                   </div>
                </Card>
              ))}
              
              <Button style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                <PlayCircle size={18} /> COMENZAR SESIÓN
              </Button>
            </div>
          )}
        </section>

        {/* History/Progress Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <Card style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
            <History size={20} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }} />
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historial</span>
          </Card>
          <Card style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <TrendingUp size={20} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }} />
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progreso</span>
          </Card>
        </div>

        {/* Debug Panel */}
        <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-md)', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid #ddd' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>🛠 Diagnóstico:</p>
          <div>ID Usuario: {user.id}</div>
          <div>Ejercicios cargados: {debugInfo.routineCount}</div>
          {debugInfo.lastError && <div style={{ color: 'red' }}>Error: {debugInfo.lastError}</div>}
        </div>
      </main>
    )}
    </div>
  );
};
