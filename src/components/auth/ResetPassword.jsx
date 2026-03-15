import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Lock } from 'lucide-react';

export const ResetPassword = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return alert('Las contraseñas no coinciden');
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert('Contraseña actualizada con éxito');
      window.location.hash = ''; // Clear hash
      if (onComplete) onComplete();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 'var(--space-md)' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: 'rgba(59, 130, 246, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto var(--space-md)' 
          }}>
            <Lock size={24} color="var(--color-accent)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>Nueva Contraseña</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Ingresa tu nueva clave de acceso</p>
        </div>

        <form onSubmit={handleReset}>
          <Input 
            label="Nueva Contraseña" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
          />
          <Input 
            label="Confirmar Contraseña" 
            type="password" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••" 
          />
          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-md)' }}>
            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
