import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ArrowLeft, Save, Plus, Trash2, Clock, Dumbbell, GripVertical, Library, X } from 'lucide-react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { ExerciseManager } from './ExerciseManager';

const DroppableColumn = ({ id, title, children, count }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{ background: isOver ? '#f1f5f9' : 'transparent', borderRadius: '16px', padding: '0.75rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px dashed', borderColor: isOver ? 'var(--color-primary)' : 'var(--color-border)', transition: 'all 0.2s' }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title} <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#64748b', padding: '2px 8px', borderRadius: '12px' }}>{count}</span>
      </h3>
      {children}
    </div>
  );
};

const DraggableCard = ({ ex, onRemove, onUpdate }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ex.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999, opacity: 0.9, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' } : undefined;

  return (
    <div ref={setNodeRef} style={style}>
      <Card style={{ padding: '0.75rem', border: '1px solid var(--color-border)', boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.02)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div {...listeners} {...attributes} style={{ cursor: 'grab', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}>
              <GripVertical size={16} />
            </div>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, lineHeight: 1.2 }}>{ex.title}</h4>
          </div>
          <button onClick={() => onRemove(ex.id)} style={{ color: '#ef4444', background: 'transparent', padding: '4px', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', display: 'block', textAlign: 'center', marginBottom: '2px' }}>SETS</label>
            <Input 
              value={ex.series} 
              onChange={(e) => onUpdate(ex.id, 'series', e.target.value)}
              placeholder="3"
              style={{ background: '#f8fafc', padding: '0.4rem', fontSize: '0.8rem', textAlign: 'center' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', display: 'block', textAlign: 'center', marginBottom: '2px' }}>REPS</label>
            <Input 
              value={ex.reps} 
              onChange={(e) => onUpdate(ex.id, 'reps', e.target.value)}
              placeholder="12"
              style={{ background: '#f8fafc', padding: '0.4rem', fontSize: '0.8rem', textAlign: 'center' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', display: 'block', textAlign: 'center', marginBottom: '2px' }}>KG/LB</label>
            <Input 
              value={ex.weight || ''} 
              onChange={(e) => onUpdate(ex.id, 'weight', e.target.value)}
              placeholder="-"
              style={{ background: '#f8fafc', padding: '0.4rem', fontSize: '0.8rem', textAlign: 'center' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', display: 'block', textAlign: 'center', marginBottom: '2px' }}>REST</label>
            <Input 
              value={ex.rest_secs} 
              onChange={(e) => onUpdate(ex.id, 'rest_secs', e.target.value)}
              placeholder="60s"
              style={{ background: '#f8fafc', padding: '0.4rem', fontSize: '0.8rem', textAlign: 'center' }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

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

  const [occupiedDates, setOccupiedDates] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // UI States
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    fetchLibrary();
    fetchHistory();
    fetchOccupiedDates();
  }, []);

  useEffect(() => {
    fetchExistingRoutine();
  }, [scheduledDate]);

  const fetchHistory = async () => {
    const { data } = await supabase.from('workouts').select('id, name, scheduled_date').eq('student_id', student.id).order('scheduled_date', { ascending: true });
    if (data) {
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
    const { data } = await supabase.from('workouts').select('scheduled_date').eq('student_id', student.id);
    if (data) setOccupiedDates(data.map(d => d.scheduled_date));
  };

  const fetchLibrary = async () => {
    const { data } = await supabase.from('exercises').select('*').order('title', { ascending: true });
    if (data) setExercises(data);
  };

  const fetchExistingRoutine = async () => {
    setLoading(true);
    try {
      const { data: workout } = await supabase.from('workouts').select('*').eq('student_id', student.id).eq('scheduled_date', scheduledDate).maybeSingle(); 
      if (workout) {
        setWorkoutName(workout.name);
        const { data: exData } = await supabase.from('workout_exercises').select('*, exercises(title, yt_video_id)').eq('workout_id', workout.id).order('order_index', { ascending: true });
        if (exData) {
          const mappedRoutine = exData.map(item => ({
            ...item.exercises,
            id: item.id.toString(), // Needs string for Dnd
            exercise_id: item.exercise_id,
            series: item.series,
            reps: item.reps,
            weight: item.weight || '',
            block: item.block || 'main',
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
    const newId = `temp-${Math.random().toString(36).substr(2, 9)}`;
    setRoutine([...routine, { 
      ...exercise, 
      id: newId, 
      exercise_id: exercise.id,
      series: '3', 
      reps: '12', 
      weight: '',
      block: exercise.default_block || 'main',
      rest_secs: 60 
    }]);
  };

  const removeFromRoutine = (id) => setRoutine(routine.filter(item => item.id !== id));
  const updateExercise = (id, field, value) => setRoutine(routine.map(item => item.id === id ? { ...item, [field]: value } : item));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && ['warmup', 'main', 'cooldown'].includes(over.id)) {
      updateExercise(active.id, 'block', over.id);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existingWorkout } = await supabase.from('workouts').select('id').eq('student_id', student.id).eq('scheduled_date', scheduledDate).maybeSingle();
      let workoutId;

      if (existingWorkout) {
        workoutId = existingWorkout.id;
        await supabase.from('workouts').update({ name: workoutName }).eq('id', workoutId);
        await supabase.from('workout_exercises').delete().eq('workout_id', workoutId);
      } else {
        const { data: newWorkout, error: wError } = await supabase.from('workouts').insert([{ trainer_id: user.id, student_id: student.id, name: workoutName, scheduled_date: scheduledDate }]).select().single();
        if (wError) throw wError;
        workoutId = newWorkout.id;
      }

      const exercisesToInsert = routine.map((item, index) => ({
        workout_id: workoutId,
        exercise_id: item.exercise_id,
        series: item.series,
        reps: item.reps,
        weight: item.weight,
        block: item.block,
        rest_secs: item.rest_secs,
        order_index: index
      }));

      const { error: exError } = await supabase.from('workout_exercises').insert(exercisesToInsert);
      if (exError) throw exError;

      alert('Rutina actualizada y asignada! 🏋️‍♂️');
      fetchHistory();
      fetchOccupiedDates();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const warmupEx = routine.filter(e => e.block === 'warmup');
  const mainEx = routine.filter(e => e.block === 'main');
  const cooldownEx = routine.filter(e => e.block === 'cooldown');

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="glass-effect" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} style={{ background: '#f1f5f9', color: 'var(--color-text-main)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Rutina para {student.first_name || student.email.split('@')[0]}</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
              <input value={workoutName} onChange={e => setWorkoutName(e.target.value)} style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-accent)', outline: 'none' }} placeholder="Nombre del entrenamiento" />
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="secondary" onClick={() => setShowLibrary(true)} style={{ height: '44px' }}>
            <Library size={18} /> Añadir Ejercicios
          </Button>
          <Button onClick={handleSave} disabled={loading || routine.length === 0} style={{ height: '44px' }}>
            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar y Asignar'}
          </Button>
        </div>
      </header>

      {/* Unified Timeline Selector */}
      <div className="premium-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {[-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(offset => {
          const date = new Date(); date.setDate(date.getDate() + offset);
          const dateStr = getLocalDateISO(date);
          const isSelected = dateStr === scheduledDate;
          return (
            <button key={offset} onClick={() => setScheduledDate(dateStr)} style={{ flex: '0 0 54px', height: '64px', padding: '8px 0', borderRadius: '12px', background: isSelected ? 'var(--grad-premium)' : 'white', color: isSelected ? 'white' : 'var(--color-text-main)', border: isSelected ? 'none' : '1px solid var(--color-border)', boxShadow: isSelected ? '0 8px 15px -3px rgba(79, 70, 229, 0.3)' : 'none', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6, fontWeight: 700 }}>{date.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{date.getDate()}</div>
              {occupiedDates.includes(dateStr) && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'white' : 'var(--color-accent)', marginTop: '4px' }} />}
            </button>
          );
        })}
      </div>

      {/* DND Board */}
      <DndContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', flex: 1 }}>
          <DroppableColumn id="warmup" title="🔥 Calentamiento" count={warmupEx.length}>
            {warmupEx.map((ex, i) => <DraggableCard key={ex.id} index={i} ex={ex} onRemove={removeFromRoutine} onUpdate={updateExercise} />)}
          </DroppableColumn>
          <DroppableColumn id="main" title="⚡ Bloque Principal" count={mainEx.length}>
            {mainEx.map((ex, i) => <DraggableCard key={ex.id} index={i} ex={ex} onRemove={removeFromRoutine} onUpdate={updateExercise} />)}
          </DroppableColumn>
          <DroppableColumn id="cooldown" title="🧘 Vuelta a la Calma" count={cooldownEx.length}>
            {cooldownEx.map((ex, i) => <DraggableCard key={ex.id} index={i} ex={ex} onRemove={removeFromRoutine} onUpdate={updateExercise} />)}
          </DroppableColumn>
        </div>
      </DndContext>

      {/* Floating Library Sidebar */}
      {showLibrary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '360px', background: 'white', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Biblioteca Técnica</h3>
              <button onClick={() => setShowLibrary(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} className="text-muted" /></button>
            </div>
            
            <div style={{ padding: '1rem' }}>
               <Button variant="secondary" onClick={() => setShowManager(true)} style={{ width: '100%' }}>
                  <Plus size={16} /> Crear Nuevo Ejercicio
               </Button>
            </div>

            <div className="premium-scroll" style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'grid', gap: '0.75rem' }}>
              {exercises.map(ex => (
                <Card key={ex.id} style={{ padding: '0.75rem', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                  {ex.yt_video_id ? (
                    <img src={`https://img.youtube.com/vi/${ex.yt_video_id}/default.jpg`} width="54" style={{ borderRadius: '8px', objectFit: 'cover' }} alt={ex.title} />
                  ) : (
                    <div style={{ width: '54px', height: '40px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Dumbbell size={16} color="#94a3b8" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: 1.2 }}>{ex.title}</span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{ex.muscle_group || 'General'}</span>
                  </div>
                  <button onClick={() => addToRoutine(ex)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise ABM Modal */}
      <ExerciseManager 
        isOpen={showManager} 
        onClose={() => setShowManager(false)} 
        onExerciseAdded={(newEx) => {
          setExercises([...exercises, newEx].sort((a,b) => a.title.localeCompare(b.title)));
          setShowManager(false);
        }} 
      />

    </div>
  );
};
