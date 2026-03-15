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
    <div style={{ display: 'grid', gap: 'var(--space-xl)', gridTemplateColumns: '1fr 2fr' }}>
      {/* Invitación */}
      <div>
        <Card>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>Invitar Alumno</h3>
          
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            <Button onClick={handleCopyLink} variant="secondary" style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)' }}>
              Copiar Enlace de Registro
            </Button>
            <Button onClick={shareWhatsApp} style={{ width: '100%', background: '#25D366', color: 'white' }}>
              Enviar por WhatsApp
            </Button>
          </div>

          <div style={{ margin: 'var(--space-lg) 0', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
             <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase' }}>O invitar por Email</p>
             <form onSubmit={handleInvite}>
                <Input 
                  placeholder="alumno@ejemplo.com" 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ marginBottom: 'var(--space-sm)' }}
                />
                <Button type="submit" variant="secondary" style={{ width: '100%', fontSize: '0.875rem' }}>
                  Enviar Invitación por Mail
                </Button>
              </form>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Cualquier alumno que se registre con este enlace aparecerá automáticamente en tu lista.
          </p>
        </Card>
      </div>

      {/* Lista de Alumnos */}
      <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
        {students.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
            <User size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.1 }} />
            <p>No tienes alumnos registrados aún.</p>
          </Card>
        ) : (
          students.map((student) => (
            <Card 
              key={student.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-md)',
                cursor: 'pointer'
              }}
              onClick={() => onSelectStudent(student)}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'var(--color-bg-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)'
              }}>
                <User size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>{student.full_name || student.email}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: '4px' }}>
                  <Activity size={14} className="status-green" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Activo hoy</span>
                </div>
              </div>
              <Button variant="secondary" style={{ padding: 'var(--space-sm)' }}>
                Gestionar Rutina <ChevronRight size={16} />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
