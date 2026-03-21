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

  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_CONFIG_WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Master user seeding and admin operations will be disabled.');
  }

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
      const password = 'Proteinas@123';
      const name = 'Master User';
      const profiles = ['creator', 'admin', 'teacher', 'almacen', 'student'];

      console.log('Seeding master user...');
      try {
        // Try to create user (will fail if exists)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        });

        if (authError) {
          if (authError.message.includes('already exists') || authError.status === 422) {
            console.log('Master user already exists in Auth, updating password...');
            // Find user to get ID
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email === email);
            if (existingUser) {
              await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
              await supabaseAdmin.from('users').upsert({
                id: existingUser.id,
                email,
                name,
                profiles,
                mustChangePassword: false,
                activityStatus: 'Activo',
                locationStatus: 'En el centro'
              });
              console.log('Master user password and record updated.');
            }
          } else {
            console.error('Error creating master user auth:', authError);
          }
          return;
        }

        if (authData?.user) {
          await supabaseAdmin.from('users').upsert({
            id: authData.user.id,
            email,
            name,
            profiles,
            mustChangePassword: false,
            activityStatus: 'Activo',
            locationStatus: 'En el centro'
          });
          console.log('Master user created successfully.');
        }
      } catch (err) {
        console.error('Unexpected error during master seeding:', err);
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

      const { email, password, name, profiles, contractType, roleType, phone, address } = req.body;
      console.log('API: Creating user:', email);

      let userId: string | null = null;

      // 1. Try to create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) {
        console.log('Auth error:', authError.message, 'Status:', authError.status);
        // If user already exists, find their ID
        const isAlreadyRegistered = 
          authError.message.toLowerCase().includes('already been registered') || 
          authError.message.toLowerCase().includes('already exists') ||
          authError.status === 422;

        if (isAlreadyRegistered) {
          console.log('User already registered in Auth, finding ID...');
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (existingUser) {
            userId = existingUser.id;
            console.log('Found existing user ID:', userId);
            // Optionally update password if provided
            if (password) {
              await supabaseAdmin.auth.admin.updateUserById(userId, { password });
            }
          } else {
            console.error('User reported as registered but not found in list.');
            throw authError;
          }
        } else {
          throw authError;
        }
      } else {
        userId = authData.user.id;
        console.log('New user created in Auth:', userId);
      }

      if (!userId) {
        throw new Error('Failed to determine user ID.');
      }

      // 2. Upsert user in our 'users' table
      console.log('Upserting user record in DB...');
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userId,
          email,
          name,
          profiles,
          contractType,
          roleType,
          phone,
          address,
          mustChangePassword: true,
          activityStatus: 'Activo',
          locationStatus: 'En el centro',
          avatar: `https://i.pravatar.cc/150?u=${userId}`
        });

      if (dbError) {
        console.error('DB Error:', dbError);
        throw dbError;
      }

      console.log('User saved successfully.');
      res.json({ success: true, userId });
    } catch (error: any) {
      console.error('Error in create-user API:', error);
      res.status(500).json({ error: error.message || 'Error desconocido al guardar el usuario' });
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
