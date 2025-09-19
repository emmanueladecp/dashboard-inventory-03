ALTER TABLE master_areas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Add is_active column to user_profiles table with default value true
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Create user_area_mappings table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_area_mappings (
    id SERIAL PRIMARY KEY,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    area_id INTEGER NOT NULL REFERENCES master_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_profile_id, area_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_area_mappings_user_profile_id ON user_area_mappings(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_area_mappings_area_id ON user_area_mappings(area_id);
CREATE INDEX IF NOT EXISTS idx_master_areas_is_active ON master_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- 5. Create trigger for automatic timestamp updates on user_area_mappings
DROP TRIGGER update_user_area_mappings_updated_at ON user_area_mappings;
CREATE TRIGGER update_user_area_mappings_updated_at 
BEFORE UPDATE ON user_area_mappings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Row Level Security on user_area_mappings
ALTER TABLE user_area_mappings ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for user_area_mappings
-- Superadmins can manage all mappings
CREATE POLICY "Superadmins can manage all user area mappings" ON user_area_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'superadmin'
        )
    );

-- Users can view their own area mappings
CREATE POLICY "Users can view their own area mappings" ON user_area_mappings
    FOR SELECT USING (
        user_profile_id IN (
            SELECT id FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- 8. Update existing policies for master_areas to consider is_active
DROP POLICY IF EXISTS "Users can view their assigned area" ON master_areas;
CREATE POLICY "Users can view their active assigned areas" ON master_areas
    FOR SELECT USING (
        is_active = TRUE AND (
            id IN (
                SELECT area_id FROM user_profiles 
                WHERE clerk_user_id = auth.jwt() ->> 'sub'
            ) OR 
            id IN (
                SELECT up.area_id FROM user_area_mappings uam
                JOIN user_profiles up ON uam.user_profile_id = up.id
                WHERE up.clerk_user_id = auth.jwt() ->> 'sub'
            )
        )
    );

-- 9. Update existing policies for user_profiles to consider is_active
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own active profile" ON user_profiles
    FOR SELECT USING (
        is_active = TRUE AND clerk_user_id = auth.jwt() ->> 'sub'
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own active profile" ON user_profiles
    FOR UPDATE USING (
        is_active = TRUE AND clerk_user_id = auth.jwt() ->> 'sub'
    )
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 10. Update existing policies for raw_materials to consider is_active
DROP POLICY IF EXISTS "Users can view raw materials from their area" ON raw_materials;
CREATE POLICY "Users can view raw materials from their active areas" ON raw_materials
    FOR SELECT USING (
        area_id IN (
            SELECT id FROM master_areas ma 
            WHERE ma.is_active = TRUE AND (
                ma.id IN (
                    SELECT area_id FROM user_profiles 
                    WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = TRUE
                ) OR 
                ma.id IN (
                    SELECT up.area_id FROM user_area_mappings uam
                    JOIN user_profiles up ON uam.user_profile_id = up.id
                    WHERE up.clerk_user_id = auth.jwt() ->> 'sub' AND up.is_active = TRUE
                )
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'superadmin' AND is_active = TRUE
        )
    );

-- 11. Update existing policies for finished_goods to consider is_active
DROP POLICY IF EXISTS "Users can view finished goods from their area" ON finished_goods;
CREATE POLICY "Users can view finished goods from their active areas" ON finished_goods
    FOR SELECT USING (
        area_id IN (
            SELECT id FROM master_areas ma 
            WHERE ma.is_active = TRUE AND (
                ma.id IN (
                    SELECT area_id FROM user_profiles 
                    WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = TRUE
                ) OR 
                ma.id IN (
                    SELECT up.area_id FROM user_area_mappings uam
                    JOIN user_profiles up ON uam.user_profile_id = up.id
                    WHERE up.clerk_user_id = auth.jwt() ->> 'sub' AND up.is_active = TRUE
                )
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND role = 'superadmin' AND is_active = TRUE
        )
    );