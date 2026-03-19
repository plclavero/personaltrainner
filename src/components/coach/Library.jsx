import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Plus, Dumbbell, Edit2 } from 'lucide-react';
import { ExerciseManager } from './ExerciseManager';

export const Library = () => {
  const [exercises, setExercises] = useState([]);
  const [showManager, setShowManager] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const openNewExercise = () => {
    setSelectedExercise(null);
    setShowManager(true);
  };

  const openEditExercise = (ex) => {
    setSelectedExercise(ex);
    setShowManager(true);
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    const { data } = await supabase.from('exercises').select('*').order('title', { ascending: true });
    if (data) setExercises(data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Tu Base de Conocimientos</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Gestiona los ejercicios disponibles para tus alumnos.</p>
        </div>
        <Button onClick={openNewExercise} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          <Plus size={18} /> Añadir Ejercicio Mágico
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {exercises.map(ex => (
          <Card key={ex.id} style={{ padding: '1rem', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            {ex.yt_video_id ? (
              <img src={`https://img.youtube.com/vi/${ex.yt_video_id}/default.jpg`} width="96" style={{ borderRadius: '8px', objectFit: 'cover', aspectRatio: '16/9' }} alt={ex.title} />
            ) : (
              <div style={{ width: '96px', height: '54px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dumbbell size={24} color="#94a3b8" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.2, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.title}</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>{ex.muscle_group || 'General'}</span>
                <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>{ex.duration || '-'}</span>
              </div>
            </div>
            <button onClick={() => openEditExercise(ex)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--color-text-muted)', borderRadius: '50%' }} title="Editar Ejercicio">
              <Edit2 size={16} />
            </button>
          </Card>
        ))}
      </div>

      <ExerciseManager 
        isOpen={showManager} 
        onClose={() => setShowManager(false)} 
        exerciseToEdit={selectedExercise}
        onExerciseSaved={(savedEx) => {
          if (selectedExercise) {
            setExercises(exercises.map(e => e.id === savedEx.id ? savedEx : e).sort((a,b) => a.title.localeCompare(b.title)));
          } else {
            setExercises([...exercises, savedEx].sort((a,b) => a.title.localeCompare(b.title)));
          }
          setShowManager(false);
        }} 
      />
    </div>
  );
};
