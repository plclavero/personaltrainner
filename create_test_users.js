import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
  { email: 'alumno1@test.com', password: 'clave123', first: 'Alumno', last: 'Uno', phone: '111111' },
  { email: 'alumno2@test.com', password: 'clave123', first: 'Alumno', last: 'Dos', phone: '222222' },
  { email: 'alumno3@test.com', password: 'clave123', first: 'Alumno', last: 'Tres', phone: '333333' },
];

async function createUsers() {
  for (const u of users) {
    console.log(`Creando ${u.email}...`);
    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
      console.error(`Error en ${u.email}:`, error.message);
    } else {
      console.log(`✅ ${u.email} creado.`);
    }
  }
}

createUsers();
