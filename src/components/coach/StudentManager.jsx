import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { UserPlus, Mail, User, ChevronRight, Activity } from 'lucide-react';

export const StudentManager = ({ onSelectStudent }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    // We fetch profiles where the role is student
    // In a real B2B, we would fetch through the 'relationships' table
    // For now, let's fetch students who have this coach assigned (to be implemented)
    // Simplified: Fetch all profiles with role 'student'
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student');
    
    if (error) console.error('Error fetching students:', error);
    else setStudents(data);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    alert(`Invitación enviada a ${inviteEmail} (Simulado 🚀)`);
    setInviteEmail('');
    setLoading(false);
  };

  const handleCopyLink = () => {
    const registrationUrl = window.location.origin;
    navigator.clipboard.writeText(registrationUrl);
    alert('¡Enlace de registro copiado! Pégalo en WhatsApp para invitar a tu alumno.');
  };

  const shareWhatsApp = () => {
    const registrationUrl = window.location.origin;
    const message = encodeURIComponent(`¡Hola! Soy tu entrenador. Regístrate aquí para empezar con tus rutinas: ${registrationUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(300px, 350px) 1fr' }}>
      {/* Invitación */}
      <div>
        <Card style={{ border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Invitar Alumno</h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <button onClick={handleCopyLink} className="btn-secondary btn-base" style={{ width: '100%' }}>
              Copiar Enlace
            </button>
            <button 
              onClick={shareWhatsApp} 
              className="btn-base"
              style={{ width: '100%', background: '#22c55e', color: 'white', fontWeight: 600 }}
            >
              Enviar WhatsApp
            </button>
          </div>

          <div style={{ margin: '2rem 0', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
             <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>O invitar por Email</p>
             <form onSubmit={handleInvite}>
                <Input 
                  placeholder="alumno@ejemplo.com" 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />
                <button type="submit" className="btn-primary btn-base" style={{ width: '100%' }}>
                  Enviar Invitación
                </button>
              </form>
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Los alumnos que se registren aparecerán aquí automáticamente.
          </p>
        </Card>
      </div>

      {/* Lista de Alumnos */}
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {students.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed var(--color-border)', background: 'transparent' }}>
            <User size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No tienes alumnos registrados aún.</p>
          </Card>
        ) : (
          students.map((student) => (
            <Card 
              key={student.id} 
              className="glass-effect"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem',
                cursor: 'pointer',
                padding: '1.5rem',
                border: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => onSelectStudent(student)}
            >
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                background: 'var(--grad-premium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
              }}>
                <User size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {student.first_name ? `${student.first_name} ${student.last_name}` : 'Nuevo Alumno'}
                </h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {student.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ACTIVO</span>
                </div>
              </div>
              <button className="btn-secondary btn-base" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Gestionar <ChevronRight size={16} />
              </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
