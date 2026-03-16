import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ArrowLeft, Save, Plus, Trash2, Clock, Dumbbell } from 'lucide-react';

export const RoutineBuilder = ({ student, onBack }) => {
  const { user } = useAuth();
  const getLocalDateISO = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [exercises, setExercises] = useState([]); // Library
  const [routine, setRoutine] = useState([]); // Exercises in workout
  const [workoutName, setWorkoutName] = useState('Nueva Rutina');
  const [scheduledDate, setScheduledDate] = useState(getLocalDateISO());

  const [occupiedDates, setOccupiedDates] = useState([]); // List of dates with workouts
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLibrary();
    fetchHistory();
    fetchOccupiedDates();
  }, []);

  useEffect(() => {
    fetchExistingRoutine();
  }, [scheduledDate]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('id, name, scheduled_date')
      .eq('student_id', student.id)
      .order('scheduled_date', { ascending: true });

    if (data) {
      // Filtrar duplicados de fecha (solo mostrar una entrada por día en la cintilla)
      const uniqueDays = [];
      const seenDates = new Set();
      data.forEach(w => {
        if (!seenDates.has(w.scheduled_date)) {
          seenDates.add(w.scheduled_date);
          uniqueDays.push(w);
        }
      });
      setRecentWorkouts(uniqueDays);
      setOccupiedDates(Array.from(seenDates));
    }
  };

  const fetchOccupiedDates = async () => {
    const { data } = await supabase
      .from('workouts')
      .select('scheduled_date')
      .eq('student_id', student.id);
    if (data) setOccupiedDates(data.map(d => d.scheduled_date));
  };

  const fetchLibrary = async () => {
    const { data } = await supabase.from('exercises').select('*');
    if (data) setExercises(data);
  };

  const fetchExistingRoutine = async () => {
    setLoading(true);
    try {
      const { data: workout } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', student.id)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle(); 

      if (workout) {
        setWorkoutName(workout.name);
        // 2. Get exercises
        const { data: exData } = await supabase
          .from('workout_exercises')
          .select('*, exercises(title, yt_video_id)')
          .eq('workout_id', workout.id)
          .order('order_index', { ascending: true });

        if (exData) {
          const mappedRoutine = exData.map(item => ({
            ...item.exercises,
            id: item.id,
            exercise_id: item.exercise_id,
            series: item.series,
            reps: item.reps,
            rest_secs: item.rest_secs,
            workout_id: item.workout_id
          }));
          setRoutine(mappedRoutine);
        }
      } else {
        setRoutine([]);
        setWorkoutName('Nueva Rutina');
      }
    } catch (err) {
      console.error('Error loading routine:', err);
    } finally {
      setLoading(false);
    }
  };


  const addToRoutine = (exercise) => {
    setRoutine([...routine, { 
      ...exercise, 
      id: `temp-${Math.random().toString(36).substr(2, 9)}`, 
      exercise_id: exercise.id,
      day_of_week: 1, 
      series: '3', 
      reps: '12', 
      rest_secs: 60 
    }]);
  };

  const removeFromRoutine = (id) => {
    setRoutine(routine.filter(item => item.id !== id));
  };

  const updateExercise = (id, field, value) => {
    setRoutine(routine.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Check if workout exists for this date to update or insert
      const { data: existingWorkout } = await supabase
        .from('workouts')
        .select('id')
        .eq('student_id', student.id)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      let workoutId;

      if (existingWorkout) {
        workoutId = existingWorkout.id;
        await supabase.from('workouts').update({ name: workoutName }).eq('id', workoutId);
        // Clean up exercises to re-insert (simpler than syncing)
        await supabase.from('workout_exercises').delete().eq('workout_id', workoutId);
      } else {
        const { data: newWorkout, error: wError } = await supabase
          .from('workouts')
          .insert([{ 
              trainer_id: user.id, 
              student_id: student.id, 
              name: workoutName,
              scheduled_date: scheduledDate
          }])
          .select()
          .single();
        if (wError) throw wError;
        workoutId = newWorkout.id;
      }

      // 2. Insert Exercises
      const exercisesToInsert = routine.map((item, index) => ({
        workout_id: workoutId,
        exercise_id: item.exercise_id,
        series: item.series,
        reps: item.reps,
        rest_secs: item.rest_secs,
        order_index: index
      }));

      const { error: exError } = await supabase.from('workout_exercises').insert(exercisesToInsert);
      if (exError) throw exError;

      alert('Rutina actualizada y asignada! 🏋️‍♂️');
      fetchHistory(); // Refresh labels
      fetchOccupiedDates(); // Refresh dots
      // Ya no llamamos a onBack() para permitir seguir editando

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="glass-effect" style={{ 
        padding: '1.25rem 1.5rem', 
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} style={{ background: '#f1f5f9', color: 'var(--color-text-main)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Rutina para {student.first_name || student.email.split('@')[0]}</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
              <input 
                value={workoutName} 
                onChange={e => setWorkoutName(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-accent)', outline: 'none' }}
                placeholder="Nombre del entrenamiento"
              />
              <input 
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }}
              />
            </div>
          </div>
        </div>
        <button 
          className="btn-primary btn-base" 
          onClick={handleSave} 
          disabled={loading || routine.length === 0}
          style={{ height: '44px' }}
        >
          <Save size={18} />
          {loading ? 'Guardando...' : 'Guardar y Asignar'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '2rem', height: 'calc(100vh - 180px)' }}>
        {/* Library Sidebar */}
        <div className="premium-scroll" style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>BIBLIOTECA TÉCNICA</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {exercises.map(ex => (
              <Card key={ex.id} style={{ padding: '0.75rem', display: 'flex', gap: '12px', alignItems: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', position: 'relative' }}>
                <img src={`https://img.youtube.com/vi/${ex.yt_video_id}/default.jpg`} width="54" style={{ borderRadius: '8px' }} alt={ex.title} />
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: 1.3 }}>{ex.title}</span>
                <button 
                  onClick={() => addToRoutine(ex)} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(79, 70, 229, 0.2)' }}
                >
                  <Plus size={18} />
                </button>
              </Card>
            ))}
          </div>
        </div>

        <div className="premium-scroll" style={{ overflowY: 'auto' }}>
           {/* Unified Timeline Selector */}
           <div className="premium-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              {[-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(offset => {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const isSelected = dateStr === scheduledDate;

                
                return (
                  <button 
                    key={offset}
                    onClick={() => setScheduledDate(dateStr)}
                    style={{ 
                      flex: '0 0 54px', 
                      height: '64px',
                      padding: '8px 0', 
                      borderRadius: '12px', 
                      background: isSelected ? 'var(--grad-premium)' : 'white',
                      color: isSelected ? 'white' : 'var(--color-text-main)',
                      border: isSelected ? 'none' : '1px solid var(--color-border)',
                      boxShadow: isSelected ? '0 8px 15px -3px rgba(79, 70, 229, 0.3)' : 'none',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6, fontWeight: 700 }}>
                      {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {date.getDate()}
                    </div>
                    {occupiedDates.includes(dateStr) && (
                      <div style={{ 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        background: isSelected ? 'white' : 'var(--color-accent)', 
                        marginTop: '4px' 
                      }} />
                    )}
                  </button>
                );
              })}
           </div>

           {routine.length === 0 ? (
             <Card style={{ 
               textAlign: 'center', 
               padding: '4rem 2rem', 
               border: '2px dashed var(--color-border)', 
               background: 'transparent',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               gap: '1rem'
             }}>
               <div style={{ width: '56px', height: '56px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Dumbbell size={28} style={{ color: 'var(--color-text-muted)' }} />
               </div>
               <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '280px' }}>Pulsa [+] en la biblioteca para añadir ejercicios a este día.</p>
             </Card>
           ) : (
             <div style={{ display: 'grid', gap: '1rem' }}>
              {routine.map((ex, index) => (
                <Card key={ex.id} style={{ padding: '1.25rem', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ background: 'var(--color-accent)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
                        {index + 1}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary)' }}>{ex.title}</h4>
                    </div>
                    <button onClick={() => removeFromRoutine(ex.id)} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', padding: '6px', borderRadius: '8px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>SERIES</label>
                      <Input 
                        value={ex.series} 
                        onChange={(e) => updateExercise(ex.id, 'series', e.target.value)}
                        placeholder="3"
                        style={{ background: '#f8fafc' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>REPS</label>
                      <Input 
                        value={ex.reps} 
                        onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                        placeholder="12"
                        style={{ background: '#f8fafc' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '6px' }}>DESCANSO (S)</label>
                      <div style={{ position: 'relative' }}>
                        <Input 
                          value={ex.rest_secs} 
                          onChange={(e) => updateExercise(ex.id, 'rest_secs', e.target.value)}
                          placeholder="60"
                          style={{ background: '#f8fafc', paddingLeft: '2.25rem' }}
                        />
                        <Clock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
