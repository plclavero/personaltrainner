import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LogIn, UserPlus } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('student'); // trainer or student

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role } // Store role in metadata
          }
        });
        if (error) throw error;
        alert('Registro exitoso. Revisa tu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: 'var(--space-md)'
    }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
            {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {isRegistering ? 'Únete como entrenador o alumno' : 'Ingresa a tu panel de control'}
          </p>
        </div>

        <form onSubmit={handleAuth}>
          {isRegistering && (
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', fontWeight: 600 }}>
                ¿Cuál es tu rol?
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <Button 
                  type="button"
                  variant={role === 'student' ? 'primary' : 'secondary'}
                  onClick={() => setRole('student')}
                  style={{ flex: 1, padding: 'var(--space-sm)' }}
                >
                  Alumno
                </Button>
                <Button 
                   type="button"
                  variant={role === 'trainer' ? 'primary' : 'secondary'}
                  onClick={() => setRole('trainer')}
                  style={{ flex: 1, padding: 'var(--space-sm)' }}
                >
                  Entrenador
                </Button>
              </div>
            </div>
          )}

          <Input 
            label="Email" 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="profe@fitness.com" 
          />
          <Input 
            label="Contraseña" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
          />

          <Button type="submit" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
            {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span style={{ marginLeft: 'var(--space-sm)' }}>
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
            </span>
          </Button>
        </form>

        <p style={{ marginTop: 'var(--space-lg)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ marginLeft: 'var(--space-xs)', color: 'var(--color-accent)', fontWeight: 600, background: 'none' }}
          >
            {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
          </button>
        </p>
      </Card>
    </div>
  );
};
