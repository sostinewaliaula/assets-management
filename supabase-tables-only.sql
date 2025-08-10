-- =====================================================
-- ASSETS MANAGEMENT SYSTEM - TABLES ONLY
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE CREATION
-- =====================================================

-- Create departments table
CREATE TABLE departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  location VARCHAR(255),
  user_count INTEGER DEFAULT 0,
  asset_count INTEGER DEFAULT 0,
  asset_value VARCHAR(50) DEFAULT '$0',
  manager VARCHAR(255),
  manager_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  phone VARCHAR(20),
  position VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255) UNIQUE,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  current_value DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active',
  condition VARCHAR(50) DEFAULT 'good',
  location VARCHAR(255),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  warranty_expiry DATE,
  last_maintenance DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issues table
CREATE TABLE issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(100),
  reported_by UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  estimated_resolution_date DATE,
  actual_resolution_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create asset_maintenance table for tracking maintenance history
CREATE TABLE asset_maintenance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_date DATE NOT NULL,
  cost DECIMAL(10,2),
  next_maintenance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_location ON departments(location);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_assets_serial ON assets(serial_number);
CREATE INDEX idx_assets_department ON assets(department_id);
CREATE INDEX idx_assets_assigned ON assets(assigned_to);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_reported_by ON issues(reported_by);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_asset ON issues(asset_id);
CREATE INDEX idx_maintenance_asset ON asset_maintenance(asset_id);
CREATE INDEX idx_maintenance_date ON asset_maintenance(performed_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- For now, allow all operations (we'll implement proper auth later)
CREATE POLICY "Allow all operations for now" ON departments FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON assets FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON issues FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON asset_maintenance FOR ALL USING (true);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update department counts when users change
CREATE OR REPLACE FUNCTION update_department_user_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE departments SET user_count = user_count + 1 WHERE id = NEW.department_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
      IF OLD.department_id IS NOT NULL THEN
        UPDATE departments SET user_count = user_count - 1 WHERE id = OLD.department_id;
      END IF;
      IF NEW.department_id IS NOT NULL THEN
        UPDATE departments SET user_count = user_count + 1 WHERE id = NEW.department_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.department_id IS NOT NULL THEN
      UPDATE departments SET user_count = user_count - 1 WHERE id = OLD.department_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update department asset counts and values
CREATE OR REPLACE FUNCTION update_department_asset_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE departments SET 
      asset_count = asset_count + 1,
      asset_value = CONCAT('$', COALESCE((
        SELECT SUM(current_value) FROM assets WHERE department_id = NEW.department_id
      ), 0))
    WHERE id = NEW.department_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
      -- Remove from old department
      IF OLD.department_id IS NOT NULL THEN
        UPDATE departments SET 
          asset_count = asset_count - 1,
          asset_value = CONCAT('$', COALESCE((
            SELECT SUM(current_value) FROM assets WHERE department_id = OLD.department_id
          ), 0))
        WHERE id = OLD.department_id;
      END IF;
      -- Add to new department
      IF NEW.department_id IS NOT NULL THEN
        UPDATE departments SET 
          asset_count = asset_count + 1,
          asset_value = CONCAT('$', COALESCE((
            SELECT SUM(current_value) FROM assets WHERE department_id = NEW.department_id
          ), 0))
        WHERE id = NEW.department_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.department_id IS NOT NULL THEN
      UPDATE departments SET 
        asset_count = asset_count - 1,
        asset_value = CONCAT('$', COALESCE((
          SELECT SUM(current_value) FROM assets WHERE department_id = OLD.department_id
        ), 0))
      WHERE id = OLD.department_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_user_count
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION update_department_user_count();

CREATE TRIGGER trigger_update_asset_stats
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_department_asset_stats();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Tables created successfully!' as status;
