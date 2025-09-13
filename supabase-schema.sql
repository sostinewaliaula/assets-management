-- =====================================================
-- ASSETS MANAGEMENT SYSTEM - SUPABASE SCHEMA
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
-- SAMPLE DATA
-- =====================================================

-- Insert sample departments
INSERT INTO departments (name, description, location, manager) VALUES
('IT Department', 'Information Technology department responsible for IT infrastructure, software development, and technical support at Turnkey Africa.', 'Turnkey Africa', 'John Odhiambo'),
('Human Resources', 'Human Resources department responsible for recruitment, employee relations, and HR operations at Turnkey Africa.', 'Turnkey Africa', 'Jane Wanjiku'),
('Finance & Accounting', 'Finance department responsible for financial planning, accounting, and budget management at Turnkey Africa.', 'Turnkey Africa', 'Mike Kamau'),
('Operations', 'Operations department responsible for day-to-day business operations and process management at Turnkey Africa.', 'Turnkey Africa', 'Sarah Akinyi'),
('Marketing', 'Marketing department responsible for brand management, campaigns, and market research at Turnkey Africa.', 'Turnkey Africa', 'David Mutua'),
('Sales', 'Sales department responsible for customer acquisition and revenue generation at Turnkey Africa.', 'Turnkey Africa', 'Lisa Nyambura'),
('Research & Development', 'R&D department responsible for innovation and product development at Turnkey Africa.', 'Turnkey Africa', 'Robert Kiprop'),
('Customer Support', 'Customer Support department responsible for customer service and technical support at Turnkey Africa.', 'Turnkey Africa', 'Emily Chebet');

-- Insert sample users
INSERT INTO users (email, name, role, department_id, phone, position) VALUES
('admin@turnkeyafrica.com', 'System Administrator', 'admin', NULL, '+254-700-000-000', 'System Administrator'),
('john.odhiambo@turnkeyafrica.com', 'John Odhiambo', 'manager', (SELECT id FROM departments WHERE name = 'IT Department'), '+254-700-000-001', 'IT Manager'),
('jane.wanjiku@turnkeyafrica.com', 'Jane Wanjiku', 'manager', (SELECT id FROM departments WHERE name = 'Human Resources'), '+254-700-000-002', 'HR Manager'),
('mike.kamau@turnkeyafrica.com', 'Mike Kamau', 'manager', (SELECT id FROM departments WHERE name = 'Finance & Accounting'), '+254-700-000-003', 'Finance Manager'),
('sarah.akinyi@turnkeyafrica.com', 'Sarah Akinyi', 'manager', (SELECT id FROM departments WHERE name = 'Operations'), '+254-700-000-004', 'Operations Manager'),
('david.mutua@turnkeyafrica.com', 'David Mutua', 'manager', (SELECT id FROM departments WHERE name = 'Marketing'), '+254-700-000-005', 'Marketing Manager'),
('lisa.nyambura@turnkeyafrica.com', 'Lisa Nyambura', 'manager', (SELECT id FROM departments WHERE name = 'Sales'), '+254-700-000-006', 'Sales Manager'),
('robert.kiprop@turnkeyafrica.com', 'Robert Kiprop', 'manager', (SELECT id FROM departments WHERE name = 'Research & Development'), '+254-700-000-007', 'R&D Manager'),
('emily.chebet@turnkeyafrica.com', 'Emily Chebet', 'manager', (SELECT id FROM departments WHERE name = 'Customer Support'), '+254-700-000-008', 'Support Manager'),
('alex.kipchirchir@turnkeyafrica.com', 'Alex Kipchirchir', 'user', (SELECT id FROM departments WHERE name = 'IT Department'), '+254-700-000-009', 'Software Developer'),
('maria.wanjiru@turnkeyafrica.com', 'Maria Wanjiru', 'user', (SELECT id FROM departments WHERE name = 'Human Resources'), '+254-700-000-010', 'HR Specialist'),
('james.kimani@turnkeyafrica.com', 'James Kimani', 'user', (SELECT id FROM departments WHERE name = 'Finance & Accounting'), '+254-700-000-011', 'Accountant'),
('sophia.muthoni@turnkeyafrica.com', 'Sophia Muthoni', 'user', (SELECT id FROM departments WHERE name = 'Operations'), '+254-700-000-012', 'Operations Analyst');

-- Update department managers
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com') WHERE name = 'IT Department';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'jane.wanjiku@turnkeyafrica.com') WHERE name = 'Human Resources';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'mike.kamau@turnkeyafrica.com') WHERE name = 'Finance & Accounting';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'sarah.akinyi@turnkeyafrica.com') WHERE name = 'Operations';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'david.mutua@turnkeyafrica.com') WHERE name = 'Marketing';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'lisa.nyambura@turnkeyafrica.com') WHERE name = 'Sales';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'robert.kiprop@turnkeyafrica.com') WHERE name = 'Research & Development';
UPDATE departments SET manager_id = (SELECT id FROM users WHERE email = 'emily.chebet@turnkeyafrica.com') WHERE name = 'Customer Support';

-- Insert sample assets
INSERT INTO assets (name, type, category, manufacturer, model, serial_number, purchase_date, purchase_price, current_value, status, condition, location, assigned_to, department_id, warranty_expiry, notes) VALUES
('MacBook Pro 16"', 'Laptop', 'Computers', 'Apple', 'MacBook Pro 16" M2', 'MBP16-M2-001', '2024-01-15', 2499.00, 2200.00, 'active', 'excellent', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'IT Department'), '2027-01-15', 'High-performance laptop for development work at Turnkey Africa'),
('Dell XPS 15', 'Laptop', 'Computers', 'Dell', 'XPS 15 9530', 'DLL-XPS15-001', '2024-02-01', 1899.00, 1700.00, 'active', 'good', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'alex.kipchirchir@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'IT Department'), '2027-02-01', 'Development laptop for Turnkey Africa'),
('iPhone 15 Pro', 'Mobile Device', 'Phones', 'Apple', 'iPhone 15 Pro', 'IPH15-PRO-001', '2024-01-20', 999.00, 900.00, 'active', 'excellent', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'IT Department'), '2027-01-20', 'Company phone for IT manager at Turnkey Africa'),
('Samsung Galaxy S24', 'Mobile Device', 'Phones', 'Samsung', 'Galaxy S24', 'SMS-GS24-001', '2024-02-10', 799.00, 750.00, 'active', 'good', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'jane.wanjiku@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'Human Resources'), '2027-02-10', 'HR manager phone for Turnkey Africa'),
('HP LaserJet Pro', 'Printer', 'Office Equipment', 'HP', 'LaserJet Pro M404n', 'HP-LJP-001', '2024-01-05', 299.00, 250.00, 'active', 'good', 'Turnkey Africa', NULL, (SELECT id FROM departments WHERE name = 'Operations'), '2026-01-05', 'Shared office printer at Turnkey Africa'),
('Cisco Switch 48-Port', 'Network Equipment', 'Networking', 'Cisco', 'Catalyst 2960', 'CSC-SW48-001', '2024-01-10', 899.00, 800.00, 'active', 'excellent', 'Turnkey Africa', NULL, (SELECT id FROM departments WHERE name = 'IT Department'), '2029-01-10', 'Core network switch for Turnkey Africa'),
('Office Desk', 'Furniture', 'Furniture', 'IKEA', 'BEKANT', 'IKEA-DSK-001', '2024-01-01', 199.00, 180.00, 'active', 'good', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'jane.wanjiku@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'Human Resources'), NULL, 'Standard office desk at Turnkey Africa'),
('Office Chair', 'Furniture', 'Furniture', 'Herman Miller', 'Aeron', 'HM-CHAIR-001', '2024-01-01', 899.00, 850.00, 'active', 'excellent', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'IT Department'), '2029-01-01', 'Ergonomic office chair for Turnkey Africa'),
('iPad Pro 12.9"', 'Tablet', 'Tablets', 'Apple', 'iPad Pro 12.9" M2', 'IPD-PRO-001', '2024-02-15', 1099.00, 1000.00, 'active', 'excellent', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'lisa.nyambura@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'Sales'), '2027-02-15', 'Sales presentation tablet for Turnkey Africa'),
('External Monitor 27"', 'Monitor', 'Displays', 'LG', '27UL850-W', 'LG-MON-001', '2024-01-25', 399.00, 350.00, 'active', 'good', 'Turnkey Africa', (SELECT id FROM users WHERE email = 'alex.kipchirchir@turnkeyafrica.com'), (SELECT id FROM departments WHERE name = 'IT Department'), '2026-01-25', 'Dual monitor setup for Turnkey Africa');

-- Insert sample issues
INSERT INTO issues (title, description, status, priority, category, reported_by, assigned_to, asset_id, department_id, estimated_resolution_date) VALUES
('Printer not working', 'HP LaserJet Pro is showing offline status and cannot print documents at Turnkey Africa.', 'open', 'medium', 'Hardware Issue', (SELECT id FROM users WHERE email = 'sarah.akinyi@turnkeyafrica.com'), (SELECT id FROM users WHERE email = 'alex.kipchirchir@turnkeyafrica.com'), (SELECT id FROM assets WHERE serial_number = 'HP-LJP-001'), (SELECT id FROM departments WHERE name = 'Operations'), '2024-03-20'),
('Network connectivity issues', 'Some users on Floor 2 are experiencing slow internet connection at Turnkey Africa.', 'in_progress', 'high', 'Network Issue', (SELECT id FROM users WHERE email = 'david.mutua@turnkeyafrica.com'), (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com'), NULL, (SELECT id FROM departments WHERE name = 'Marketing'), '2024-03-18'),
('Software license expired', 'Adobe Creative Suite license has expired and needs renewal at Turnkey Africa.', 'open', 'medium', 'Software Issue', (SELECT id FROM users WHERE email = 'emily.chebet@turnkeyafrica.com'), (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com'), NULL, (SELECT id FROM departments WHERE name = 'Customer Support'), '2024-03-25'),
('Laptop battery replacement', 'MacBook Pro battery is draining quickly and needs replacement at Turnkey Africa.', 'scheduled', 'low', 'Hardware Issue', (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com'), (SELECT id FROM users WHERE email = 'alex.kipchirchir@turnkeyafrica.com'), (SELECT id FROM assets WHERE serial_number = 'MBP16-M2-001'), (SELECT id FROM departments WHERE name = 'IT Department'), '2024-03-30'),
('Email server down', 'Turnkey Africa email server is not responding, affecting all departments.', 'resolved', 'critical', 'System Issue', (SELECT id FROM users WHERE email = 'admin@turnkeyafrica.com'), (SELECT id FROM users WHERE email = 'john.odhiambo@turnkeyafrica.com'), NULL, (SELECT id FROM departments WHERE name = 'IT Department'), '2024-03-15');

-- Insert sample maintenance records
INSERT INTO asset_maintenance (asset_id, maintenance_type, description, performed_by, performed_date, cost, next_maintenance_date) VALUES
((SELECT id FROM assets WHERE serial_number = 'CSC-SW48-001'), 'Preventive Maintenance', 'Regular network switch maintenance and firmware update at Turnkey Africa', (SELECT id FROM users WHERE email = 'alex.kipchirchir@turnkeyafrica.com'), '2024-02-15', 150.00, '2024-05-15'),
((SELECT id FROM assets WHERE serial_number = 'HP-LJP-001'), 'Repair', 'Fixed paper jam and replaced toner cartridge at Turnkey Africa', (SELECT id FROM users WHERE email = 'alex.kipchirchir@turnkeyafrica.com'), '2024-03-10', 75.00, '2024-06-10'),
((SELECT id FROM assets WHERE serial_number = 'HM-CHAIR-001'), 'Inspection', 'Regular ergonomic chair inspection and adjustment at Turnkey Africa', (SELECT id FROM users WHERE email = 'jane.wanjiku@turnkeyafrica.com'), '2024-02-20', 25.00, '2024-05-20');

-- =====================================================
-- UPDATE COUNTS AND VALUES
-- =====================================================

-- Update department user counts
UPDATE departments SET user_count = (
  SELECT COUNT(*) FROM users WHERE department_id = departments.id
);

-- Update department asset counts
UPDATE departments SET asset_count = (
  SELECT COUNT(*) FROM assets WHERE department_id = departments.id
);

-- Update department asset values
UPDATE departments SET asset_value = (
  SELECT CONCAT('$', COALESCE(SUM(current_value), 0)) 
  FROM assets 
  WHERE department_id = departments.id
);

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
-- FINAL STATUS
-- =====================================================

-- Display final counts
SELECT 'Database Setup Complete!' as status;
SELECT COUNT(*) as total_departments FROM departments;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_assets FROM assets;
SELECT COUNT(*) as total_issues FROM issues;
SELECT COUNT(*) as total_maintenance_records FROM asset_maintenance;
