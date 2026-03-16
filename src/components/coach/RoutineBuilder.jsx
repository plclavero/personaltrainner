import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ArrowLeft, Save, Plus, Trash2, Clock, Dumbbell } from 'lucide-react';

export const RoutineBuilder = ({ student, onBack }) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]); // Library
  const [routine, setRoutine] = useState([]); // Exercises in workout
  const [workoutName, setWorkoutName] = useState('Nueva Rutina');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
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
    console.log('🧪 Debug RoutineBuilder: Buscando para alumno ID:', student.id);
    setLoading(true);
    try {
      console.log('🧪 Debug RoutineBuilder: Buscando para alumno ID:', student.id, 'Fecha:', scheduledDate);
      const { data: workout, error: wError } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', student.id)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (wError) console.error('❌ Error fetching workout header:', wError);
      console.log('🧪 Debug RoutineBuilder: Resultado Workout:', workout);

      if (workout) {
        setWorkoutName(workout.name);
        // 2. Get exercises
        const { data: exData, error } = await supabase
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
        // Reset if no workout found for this specific date
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
      onBack();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button onClick={onBack} style={{ background: 'none', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Rutina para {student.first_name || student.email}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginTop: '4px' }}>
            <input 
              value={workoutName} 
              onChange={e => setWorkoutName(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-accent)', outline: 'none' }}
              placeholder="Nombre del entrenamiento"
            />
            <input 
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.875rem' }}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading || routine.length === 0}>
          <Save size={18} />
          {loading ? 'Guardando...' : 'Guardar y Asignar'}
        </Button>
      </header>

      <div style={{ display: 'grid', gap: 'var(--space-xl)', gridTemplateColumns: '1fr 2fr' }}>
        {/* Biblioteca Column */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Tu Biblioteca</h3>
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {exercises.map(ex => (
              <Card key={ex.id} style={{ padding: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                <img src={`https://img.youtube.com/vi/${ex.yt_video_id}/default.jpg`} width="60" style={{ borderRadius: '4px' }} alt={ex.title} />
                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{ex.title}</span>
                <button onClick={() => addToRoutine(ex)} style={{ background: 'none', color: 'var(--color-accent)' }}>
                  <Plus size={20} />
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Builder Column */}
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
           {/* Unified Timeline Selector */}
           <div style={{ display: 'flex', overflowX: 'auto', gap: 'var(--space-sm)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)', scrollbarWidth: 'none' }}>
              {[-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(offset => {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = dateStr === scheduledDate;
                
                return (
                  <button 
                    key={offset}
                    onClick={() => setScheduledDate(dateStr)}
                    style={{ 
                      flex: '0 0 50px', 
                      height: '60px',
                      padding: 'var(--space-xs)', 
                      borderRadius: '8px', 
                      background: isSelected ? 'var(--color-accent)' : 'white',
                      color: isSelected ? 'white' : 'var(--color-text-main)',
                      border: isSelected ? 'none' : '1px solid var(--color-border)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.5rem', textTransform: 'uppercase', opacity: 0.8 }}>
                      {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      {date.getDate()}
                    </div>
                    {occupiedDates.includes(dateStr) && (
                      <div style={{ 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        background: isSelected ? 'white' : 'var(--color-accent)', 
                        margin: '2px auto 0' 
                      }} />
                    )}
                  </button>
                );
              })}
           </div>

           {routine.length === 0 ? (
             <Card style={{ textAlign: 'center', padding: 'var(--space-xl)', borderStyle: 'dashed' }}>
                <Dumbbell size={48} style={{ opacity: 0.1, marginBottom: 'var(--space-md)' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>Click en [+] en la biblioteca para añadir ejercicios.</p>
             </Card>
           ) : (
             routine.map((ex) => (
               <Card key={ex.id}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                   <h4 style={{ margin: 0 }}>{ex.title}</h4>
                   <button onClick={() => removeFromRoutine(ex.id)} style={{ background: 'none', color: 'var(--color-danger)' }}>
                     <Trash2 size={18} />
                   </button>
                 </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
                    <Input 
                      label="Series" 
                      value={ex.series} 
                      onChange={e => updateExercise(ex.id, 'series', e.target.value)} 
                    />
                    <Input 
                      label="Reps" 
                      value={ex.reps} 
                      onChange={e => updateExercise(ex.id, 'reps', e.target.value)} 
                    />
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Descanso (s)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'var(--color-bg-main)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-main)' }}>
                        <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <input 
                           type="number"
                           value={ex.rest_secs} 
                           onChange={e => updateExercise(ex.id, 'rest_secs', parseInt(e.target.value))}
                           style={{ background: 'none', border: 'none', width: '100%', outline: 'none', fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>
                  </div>
               </Card>
             ))
           )}
        </div>
      </div>
    </div>
  );
};
