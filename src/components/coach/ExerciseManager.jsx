import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Video, Plus, Trash2, ExternalLink } from 'lucide-react';

export const ExerciseManager = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [ytUrl, setYtUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching exercises:', error);
    else setExercises(data);
  };

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    const videoId = getYoutubeId(ytUrl);
    
    if (!videoId) {
      alert('Por favor, ingresa una URL de YouTube válida.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('exercises').insert([
        {
          trainer_id: user.id,
          yt_video_id: videoId,
          title: title || 'Nuevo Ejercicio',
          description: '',
        }
      ]);

      if (error) throw error;
      
      setYtUrl('');
      setTitle('');
      fetchExercises();
    } catch (err) {
      alert('Error al guardar el ejercicio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return;
    
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchExercises();
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-xl)', gridTemplateColumns: '1fr 2fr' }}>
      {/* Formulario */}
      <div>
        <Card>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>Añadir Ejercicio</h3>
          <form onSubmit={handleAddExercise}>
            <Input 
              label="Link de YouTube" 
              placeholder="https://www.youtube.com/watch?v=..." 
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              required
            />
            <Input 
              label="Título del Ejercicio" 
              placeholder="Ej: Sentadilla Goblet" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Button type="submit" style={{ width: '100%' }} disabled={loading}>
              <Plus size={18} />
              {loading ? 'Guardando...' : 'Añadir a Biblioteca'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Lista de Ejercicios */}
      <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {exercises.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
            <Video size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
            <p>Aún no tienes ejercicios en tu biblioteca.</p>
          </div>
        ) : (
          exercises.map((ex) => (
            <Card key={ex.id} style={{ padding: 0, overflow: 'hidden' }}>
              <img 
                src={`https://img.youtube.com/vi/${ex.yt_video_id}/mqdefault.jpg`} 
                alt={ex.title} 
                style={{ width: '100%', height: '140px', objectFit: 'cover' }}
              />
              <div style={{ padding: 'var(--space-md)' }}>
                <h4 style={{ marginBottom: 'var(--space-xs)', fontSize: '1rem' }}>{ex.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-md)' }}>
                   <a 
                    href={`https://youtube.com/watch?v=${ex.yt_video_id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-accent)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={14} /> Ver Video
                  </a>
                  <button 
                    onClick={() => handleDelete(ex.id)}
                    style={{ background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
