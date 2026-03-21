import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Admin Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lidszakjqqaccyfqiaoj.supabase.co';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = supabaseServiceRoleKey 
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  // Seed Master User
  if (supabaseAdmin) {
    const seedMaster = async () => {
      const email = 'managerproapp@gmail.com';
      const password = 'abcd123';
      const name = 'Master User';
      const profiles = ['creator', 'admin', 'teacher', 'almacen', 'student'];

      console.log('Checking for master user...');
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError);
        return;
      }

      const masterExists = users.users.some(u => u.email === email);
      if (!masterExists) {
        console.log('Master user not found, creating...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        });

        if (authError) {
          console.error('Error creating master user auth:', authError);
          return;
        }

        const { error: dbError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: authData.user.id,
            email,
            name,
            profiles,
            mustChangePassword: true,
            activityStatus: 'Activo',
            locationStatus: 'En el centro'
          });

        if (dbError) {
          console.error('Error creating master user record:', dbError);
        } else {
          console.log('Master user created successfully');
        }
      } else {
        console.log('Master user already exists');
      }
    };
    seedMaster();
  }

  // API routes
  app.post('/api/admin/create-user', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase Service Role Key not configured.' });
      }

      const { email, password, name, profiles } = req.body;

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) throw authError;

      // 2. Create user in our 'users' table
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          profiles,
          mustChangePassword: true,
          activityStatus: 'Activo',
          locationStatus: 'En el centro'
        });

      if (dbError) throw dbError;

      res.json({ success: true, user: authData.user });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
