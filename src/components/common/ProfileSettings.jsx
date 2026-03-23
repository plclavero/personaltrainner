import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { User, Phone, Mail, Save, X } from 'lucide-react';

export const ProfileSettings = ({ onSave, onCancel }) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      const updates = {};
      if (email !== user.email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) throw authError;
      }

      alert('Perfil y credenciales actualizados correctamente');
      setPassword('');
      if (onSave) onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: '500px', margin: 'var(--space-xl) auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Mis Datos Personales</h2>
        {onCancel && (
          <button onClick={onCancel} style={{ background: 'none', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 'var(--space-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <Input 
            label="Nombre" 
            value={firstName} 
            onChange={e => setFirstName(e.target.value)}
            placeholder="Juan"
            icon={<User size={16} />}
          />
          <Input 
            label="Apellido" 
            value={lastName} 
            onChange={e => setLastName(e.target.value)}
            placeholder="Pérez"
          />
        </div>
        
        <Input 
          label="Número de WhatsApp" 
          value={phone} 
          onChange={e => setPhone(e.target.value)}
          placeholder="+54 9 11 ..."
          icon={<Phone size={16} />}
        />

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Credenciales de Acceso</h3>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <Input 
              label="Correo Electrónico (Email)" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
            />
            <Input 
              type="password"
              label="Nueva Contraseña (dejar en blanco para no cambiar)" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Escribe una nueva clave..."
            />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
          <Button type="submit" disabled={loading} style={{ flex: 1 }}>
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};
