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
  const [occupiedDates, setOccupiedDates] = useState([]); 
  const [activeVideo, setActiveVideo] = useState(null); // ID del video de YouTube


  useEffect(() => {
    fetchMyRoutine();
    fetchOccupiedDates();
  }, [selectedDate]);

  const fetchOccupiedDates = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('scheduled_date')
      .eq('student_id', user.id);
    if (data) setOccupiedDates(data.map(d => d.scheduled_date));
  };

  const fetchMyRoutine = async () => {
    try {
      const { data: workout } = await supabase
        .from('workouts')
        .select('id, name')
        .eq('student_id', user.id)
        .eq('scheduled_date', selectedDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 

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
      } else {
        setRoutine([]);
        setWorkoutName('');
      }
    } catch (err) {

      console.error('Error fetching routine:', err);

    } finally {
      setLoading(false);
    }
  };

  const VideoModal = ({ videoId, onClose }) => (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' 
    }}>
      <div style={{ width: '100%', maxWidth: '800px', background: 'black', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
        >
          ✕
        </button>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)' }}>
      {/* Premium Header with Glassmorphism */}
      <header className="glass-effect" style={{ 
        padding: '1.25rem 1.5rem', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--grad-premium)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <TrendingUp size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Atleta Panel</h2>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--color-text-main)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={20} />
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {showSettings ? (
        <main style={{ padding: 'var(--space-lg)' }}>
          <ProfileSettings onSave={() => setShowSettings(false)} onCancel={() => setShowSettings(false)} />
        </main>
      ) : (
        <main style={{ padding: '2rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', background: 'var(--grad-premium)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ¡Hola, {user.first_name || 'Atleta'}! 👋
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Tu progreso de hoy te espera.</p>
          </div>

        {/* Premium Timeline Selector */}
        <div className="premium-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          {[-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(offset => {
            const date = new Date();
            date.setDate(date.getDate() + offset);
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            
            return (
              <button 
                key={offset}
                onClick={() => setSelectedDate(dateStr)}
                style={{ 
                  flex: '0 0 64px', 
                  height: '84px',
                  padding: '12px 0', 
                  borderRadius: '16px', 
                  background: isSelected ? 'var(--grad-premium)' : 'white',
                  color: isSelected ? 'white' : 'var(--color-text-main)',
                  border: isSelected ? 'none' : '1px solid var(--color-border)',
                  boxShadow: isSelected ? '0 10px 15px -3px rgba(79, 70, 229, 0.4)' : 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6, fontWeight: 600, marginBottom: '6px' }}>
                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {date.getDate()}
                </div>
                {occupiedDates.includes(dateStr) && (
                  <div style={{ 
                    width: '5px', 
                    height: '5px', 
                    borderRadius: '50%', 
                    background: isSelected ? 'white' : 'var(--color-accent)', 
                    marginTop: '6px' 
                  }} />
                )}
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
            <Card style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 'var(--space-md)', 
              padding: '3rem 2rem', 
              textAlign: 'center',
              border: '2px dashed var(--color-border)',
              background: 'transparent'
            }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Clock size={32} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Día de descanso</h3>
                <p style={{ fontSize: '0.925rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Hoy no tienes rutina cargada. Deja que tu cuerpo se recupere para volver con todo mañana. 💪🏽🏻</p>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {routine.map((item) => (
                <Card key={item.id} style={{ padding: '0', overflow: 'hidden', display: 'flex', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                   <div style={{ width: '110px', position: 'relative' }}>
                      <img 
                        src={`https://img.youtube.com/vi/${item.exercises?.yt_video_id}/mqdefault.jpg`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        alt={item.exercises?.title || 'Ejercicio'}
                      />
                      <div 
                        onClick={() => setActiveVideo(item.exercises?.yt_video_id)}
                        style={{ 
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', 
                          justifyContent: 'center', color: 'white', cursor: 'pointer'
                        }}
                      >
                        <PlayCircle size={32} />
                      </div>
                   </div>
                   <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary)' }}>{item.exercises?.title || 'Ejercicio sin nombre'}</h4>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>{item.series} SERIES</div>
                        <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>{item.reps} REPS</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {item.rest_secs}s
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveVideo(item.exercises?.yt_video_id)}
                        style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}
                      >
                         <ExternalLink size={12} /> VER TÉCNICA
                      </button>
                   </div>
                </Card>
              ))}
              
              <button 
                className="btn-primary btn-base" 
                style={{ width: '100%', marginTop: '1rem', height: '56px', fontSize: '1.1rem' }}
              >
                <PlayCircle size={22} /> COMENZAR SESIÓN
              </button>
            </div>
          )}
        </section>

        {/* History/Progress Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <Card style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f8fafc', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <History size={22} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>HISTORIAL</span>
          </Card>
          <Card style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f8fafc', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <TrendingUp size={22} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>PROGRESO</span>
          </Card>
        </div>
      </main>
    )}
    {activeVideo && <VideoModal videoId={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
};
