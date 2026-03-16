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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLibrary();
    fetchExistingRoutine();
  }, []);

  const fetchLibrary = async () => {
    const { data } = await supabase.from('exercises').select('*');
    if (data) setExercises(data);
  };

  const fetchExistingRoutine = async () => {
    console.log('🧪 Debug RoutineBuilder: Buscando para alumno ID:', student.id);
    setLoading(true);
    try {
      const { data: workout, error: wError } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)
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
            day_of_week: item.day_of_week,
            series: item.series,
            reps: item.reps,
            rest_secs: item.rest_secs,
            workout_id: item.workout_id
          }));
          setRoutine(mappedRoutine);
        }
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
      // 1. Clean up old exercises for this student if we want to "overwrite"
      // or just create a new workout group. 
      // User says "two days", let's assume one Workout object can have many days.
      
      const { data: workout, error: wError } = await supabase
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

      // 2. Insert Exercises
      const exercisesToInsert = routine.map((item, index) => ({
        workout_id: workout.id,
        exercise_id: item.exercise_id,
        day_of_week: item.day_of_week,
        series: item.series,
        reps: item.reps,
        rest_secs: item.rest_secs,
        order_index: index
      }));

      const { error: exError } = await supabase.from('workout_exercises').insert(exercisesToInsert);
      if (exError) throw exError;

      alert('Rutina actualizada y asignada! 🏋️‍♂️');
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
          <h2 style={{ margin: 0 }}>Rutina para {student.full_name || student.email}</h2>
          <Input 
            value={workoutName} 
            onChange={e => setWorkoutName(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-accent)' }}
          />
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
