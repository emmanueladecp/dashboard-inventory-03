-- Inventory Dashboard Database Schema
-- This file contains all the SQL commands to set up the database schema

-- Enable Row Level Security (RLS) on all tables
-- Create extension for UUID generation (if not exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Master Areas Table
CREATE TABLE IF NOT EXISTS master_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    erp_id INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('superadmin', 'area sales manager', 'area sales supervisor')) DEFAULT 'area sales supervisor',
    area_id INTEGER REFERENCES master_areas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Raw Materials Table
CREATE TABLE IF NOT EXISTS raw_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    erp_id INTEGER NOT NULL UNIQUE,
    current_stock INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',
    area_id INTEGER NOT NULL REFERENCES master_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Finished Goods Table
CREATE TABLE IF NOT EXISTS finished_goods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    erp_id INTEGER NOT NULL UNIQUE,
    current_stock INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',
    area_id INTEGER NOT NULL REFERENCES master_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_area_id ON user_profiles(area_id);
CREATE INDEX IF NOT EXISTS idx_raw_materials_area_id ON raw_materials(area_id);
CREATE INDEX IF NOT EXISTS idx_finished_goods_area_id ON finished_goods(area_id);
CREATE INDEX IF NOT EXISTS idx_master_areas_erp_id ON master_areas(erp_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_master_areas_updated_at BEFORE UPDATE ON master_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finished_goods_updated_at BEFORE UPDATE ON finished_goods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE master_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE finished_goods ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Master Areas: Only superadmins can manage, others can view their assigned area
CREATE POLICY "Superadmins can manage all areas" ON master_areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Users can view their assigned area" ON master_areas
    FOR SELECT USING (
        id IN (
            SELECT area_id FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- User Profiles: Users can view their own profile, superadmins can manage all
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub')
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Superadmins can manage all user profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'superadmin'
        )
    );

-- Raw Materials: Users can only view materials from their assigned area
CREATE POLICY "Users can view raw materials from their area" ON raw_materials
    FOR SELECT USING (
        area_id IN (
            SELECT area_id FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub'
        ) OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'superadmin'
        )
    );

-- Finished Goods: Users can only view goods from their assigned area
CREATE POLICY "Users can view finished goods from their area" ON finished_goods
    FOR SELECT USING (
        area_id IN (
            SELECT area_id FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub'
        ) OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'superadmin'
        )
    );

-- Insert sample data for testing
INSERT INTO master_areas (name, erp_id) VALUES 
    ('North Zone', 1001),
    ('South Zone', 1002),
    ('East Zone', 1003),
    ('West Zone', 1004),
    ('Central Zone', 1005)
ON CONFLICT (erp_id) DO NOTHING;

-- Insert sample raw materials
INSERT INTO raw_materials (name, erp_id, current_stock, unit, area_id) VALUES 
    ('Steel Bars', 2001, 150, 'kg', 1),
    ('Aluminum Sheets', 2002, 200, 'pieces', 1),
    ('Copper Wire', 2003, 500, 'meters', 2),
    ('Plastic Granules', 2004, 1000, 'kg', 2),
    ('Glass Panels', 2005, 75, 'pieces', 3)
ON CONFLICT (erp_id) DO NOTHING;

-- Insert sample finished goods
INSERT INTO finished_goods (name, erp_id, current_stock, unit, area_id) VALUES 
    ('Product A', 3001, 50, 'pieces', 1),
    ('Product B', 3002, 120, 'pieces', 1),
    ('Product C', 3003, 80, 'pieces', 2),
    ('Product D', 3004, 200, 'pieces', 2),
    ('Product E', 3005, 30, 'pieces', 3)
ON CONFLICT (erp_id) DO NOTHING;