import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { UserPlus, ShieldAlert } from 'lucide-react';

export const TestUserCreator = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const testUsers = [
    { email: 'alumno1@test.com', password: 'clave123', first: 'Alumno', last: 'Uno', phone: '111111' },
    { email: 'alumno2@test.com', password: 'clave123', first: 'Alumno', last: 'Dos', phone: '222222' },
    { email: 'alumno3@test.com', password: 'clave123', first: 'Alumno', last: 'Tres', phone: '333333' },
  ];

  const createAll = async () => {
    setLoading(true);
    const newResults = [];
    for (const u of testUsers) {
      try {
        const { error } = await supabase.auth.signUp({
          email: u.email,
          password: u.password,
          options: {
            data: {
              role: 'student',
              first_name: u.first,
              last_name: u.last,
              phone: u.phone
            }
          }
        });
        if (error) throw error;
        newResults.push({ email: u.email, status: '✅ Creado' });
      } catch (err) {
        newResults.push({ email: u.email, status: `❌ ${err.message}` });
      }
    }
    setResults(newResults);
    setLoading(false);
  };

  return (
    <div style={{ padding: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-md)' }} />
          <h2>Creador de Usuarios de Prueba</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Crea rápidamente los 3 alumnos solicitados.</p>
        </div>

        <Button onClick={createAll} disabled={loading} style={{ width: '100%' }}>
          <UserPlus size={18} />
          {loading ? 'Procesando...' : 'Crear 3 Alumnos (clave123)'}
        </Button>

        {results.length > 0 && (
          <div style={{ marginTop: 'var(--space-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                <span>{r.email}</span>
                <span style={{ fontWeight: 600 }}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <p style={{ textAlign: 'center', marginTop: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        Nota: Esto funciona porque la confirmación de email está desactivada.
      </p>
    </div>
  );
};
