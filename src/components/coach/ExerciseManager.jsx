import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { X, Youtube, Loader2, Save } from 'lucide-react';

export const ExerciseManager = ({ isOpen, onClose, onExerciseSaved, exerciseToEdit }) => {
  const [url, setUrl] = useState('');
  const [loadingYt, setLoadingYt] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    yt_video_id: '',
    muscle_group: 'Pecho',
    default_block: 'main',
    duration: ''
  });

  useEffect(() => {
    if (exerciseToEdit) {
      setFormData(exerciseToEdit);
      setUrl(`https://youtu.be/${exerciseToEdit.yt_video_id}`);
    } else {
      setFormData({ title: '', description: '', yt_video_id: '', muscle_group: 'Pecho', default_block: 'main', duration: '' });
      setUrl('');
    }
  }, [exerciseToEdit, isOpen]);

  const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Movilidad', 'Cardio', 'Full Body'];
  const BLOCKS = [
    { value: 'warmup', label: 'Calentamiento' },
    { value: 'main', label: 'Principal' },
    { value: 'cooldown', label: 'Vuelta a la calma' }
  ];

  if (!isOpen) return null;

  const extractYTId = (link) => {
    const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };

  const handleUrlBlur = async () => {
    if (!url) return;
    const videoId = extractYTId(url);
    if (!videoId) {
      alert('Link de YouTube inválido');
      return;
    }

    setFormData(prev => ({ ...prev, yt_video_id: videoId }));
    setLoadingYt(true);

    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) throw new Error('Falta configuración de API Key');

      // YouTube API fetch
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const snippet = data.items[0].snippet;
        const rawDuration = data.items[0].contentDetails.duration;
        
        let parsedDuration = '';
        const match = rawDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const h = match[1] ? parseInt(match[1]) : 0;
          const m = match[2] ? parseInt(match[2]) : 0;
          const s = match[3] ? parseInt(match[3]) : 0;
          const totalMins = h * 60 + m;
          parsedDuration = `${totalMins}:${s.toString().padStart(2, '0')}`;
        }

        setFormData(prev => ({
          ...prev,
          title: snippet.title,
          description: snippet.description ? snippet.description.substring(0, 200) : '',
          duration: parsedDuration
        }));
      } else {
        alert('No se encontró información del video');
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      alert('Error obteniendo datos de YouTube. ' + error.message);
    } finally {
      setLoadingYt(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.yt_video_id) {
      alert('El título y video son obligatorios');
      return;
    }
    setSaving(true);
    try {
      let savedData;
      if (exerciseToEdit) {
        const { data, error } = await supabase.from('exercises').update(formData).eq('id', exerciseToEdit.id).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const { data, error } = await supabase.from('exercises').insert([formData]).select().single();
        if (error) throw error;
        savedData = data;
      }
      
      if (onExerciseSaved) onExerciseSaved(savedData);
      onClose();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <Card style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
          <X size={20} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '12px', display: 'flex', color: '#ef4444' }}>
             <Youtube size={22} />
          </div>
          {exerciseToEdit ? 'Editar Ejercicio' : 'Añadir Ejercicio'}
        </h2>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>LINK DE YOUTUBE</label>
            <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
              <Input 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                onBlur={handleUrlBlur}
                placeholder="https://youtu.be/..." 
                style={{ flex: 1, paddingRight: loadingYt ? '40px' : '16px' }}
              />
              {loadingYt && <Loader2 size={18} className="animate-spin text-primary" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} />}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>Pega el link y haz clic fuera del cuadro para extraer los datos.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>TÍTULO</label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData(prev => ({...prev, title: e.target.value}))} 
                placeholder="Ej. Sentadilla con Barra" 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>DURACIÓN</label>
              <Input 
                value={formData.duration} 
                onChange={e => setFormData(prev => ({...prev, duration: e.target.value}))} 
                placeholder="Ej. 1:15" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>GRUPO MUSCULAR</label>
              <select 
                value={formData.muscle_group}
                onChange={e => setFormData(prev => ({...prev, muscle_group: e.target.value}))}
                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem', background: '#f8fafc', color: 'var(--color-text-main)', cursor: 'pointer' }}
              >
                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>MOMENTO SUGERIDO</label>
              <select 
                value={formData.default_block}
                onChange={e => setFormData(prev => ({...prev, default_block: e.target.value}))}
                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem', background: '#f8fafc', color: 'var(--color-text-main)', cursor: 'pointer' }}
              >
                {BLOCKS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || !formData.title} className="btn-primary" style={{ marginTop: '1rem', height: '48px', fontSize: '1rem' }}>
            {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Guardar en Biblioteca</>}
          </Button>
        </div>
      </Card>
    </div>
  );
};
