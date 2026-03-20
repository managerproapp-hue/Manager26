-- Supabase SQL Schema for Manager Pro

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  profiles TEXT[] DEFAULT '{}',
  activity_status TEXT CHECK (activity_status IN ('Activo', 'De Baja')),
  location_status TEXT CHECK (location_status IN ('En el centro', 'Fuera del centro')),
  contract_type TEXT CHECK (contract_type IN ('Fijo', 'Interino')),
  role_type TEXT CHECK (role_type IN ('Titular', 'Sustituto')),
  classroom_id TEXT,
  phone TEXT,
  secondary_phone TEXT,
  address TEXT,
  student_simulated_profile TEXT CHECK (student_simulated_profile IN ('teacher', 'almacen')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  reference TEXT NOT NULL,
  unit TEXT NOT NULL,
  tax NUMERIC NOT NULL,
  category TEXT NOT NULL,
  family TEXT NOT NULL,
  allergens TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('Activo', 'Inactivo')),
  product_state TEXT,
  warehouse_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cif TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  status TEXT CHECK (status IN ('Activo', 'Inactivo')),
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Regular', 'Extraordinario')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  budget_per_teacher NUMERIC NOT NULL,
  authorized_teachers TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('Activo', 'Inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL,
  event_id UUID REFERENCES events(id),
  cost NUMERIC,
  notes TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  author_id UUID REFERENCES users(id),
  yield_amount NUMERIC NOT NULL,
  yield_unit TEXT NOT NULL,
  category TEXT NOT NULL,
  preparation_steps TEXT,
  is_public BOOLEAN DEFAULT false,
  cost NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  ingredients JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id)
);

-- RLS (Row Level Security) - Basic setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policies (Example: Allow authenticated users to read everything)
CREATE POLICY "Allow authenticated read" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read" ON recipes FOR SELECT USING (auth.role() = 'authenticated');
