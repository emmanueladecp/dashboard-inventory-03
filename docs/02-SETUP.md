# Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: Version 18.17 or later
- **npm**: Version 9.0 or later (or yarn/pnpm)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### External Services
1. **Clerk Account**: For authentication ([clerk.com](https://clerk.com))
2. **Supabase Project**: For database ([supabase.com](https://supabase.com))

## Installation Steps

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd dashboard_03/project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# iDempiere ERP Integration
NEXT_IDEMPIERE_URL=https://your-idempiere-server.com
IDEMPIERE_TOKEN=eyJraWQiOiJpZGVtcGllcmUi...
```

### 4. Clerk Setup

#### Create a Clerk Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Choose your preferred authentication methods
4. Copy the API keys to your `.env.local` file

#### Configure Authentication Settings
```javascript
// In Clerk Dashboard -> Authentication
// Enable the following providers:
- Email/Password ✅
- Email Link (optional) ✅
- Google OAuth (optional) ✅

// Set redirect URLs:
- Sign-in: http://localhost:3000/dashboard
- Sign-up: http://localhost:3000/dashboard
- After sign-out: http://localhost:3000
```

#### Set Up Webhooks (Optional)
```javascript
// In Clerk Dashboard -> Webhooks
// Endpoint URL: http://localhost:3000/api/webhooks/clerk
// Events to subscribe:
- user.created ✅
- user.updated ✅
- session.created ✅
```

### 5. Supabase Setup

#### Create a Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Choose a database password
4. Wait for project initialization
5. Copy the project URL and API keys

#### Database Schema Setup
Run the following SQL commands in Supabase SQL Editor:

```sql
-- 1. Run initial schema
-- Copy and paste content from database_schema.sql
```

#### Enable Row Level Security
```sql
-- Ensure RLS is enabled on all tables
ALTER TABLE master_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE finished_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_area_mappings ENABLE ROW LEVEL SECURITY;
```

#### Run Migrations
```sql
-- Copy and paste content from database_migration.sql
-- This adds additional features like user deactivation and multi-area support
```

### 6. iDempiere ERP Integration Setup

#### Configure iDempiere Connection
1. Obtain the iDempiere server URL from your ERP administrator
2. Generate or obtain a JWT authentication token for API access
3. Verify the token has access to the `vw_product_fg` view
4. Add the configuration to your `.env.local` file

#### Test iDempiere Connection
```bash
# Test the API endpoint manually
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     YOUR_IDEMPIERE_URL/api/v1/models/vw_product_fg
```

#### Expected Response Structure
```json
{
  "page-count": 1,
  "records-size": 3000,
  "skip-records": 0,
  "row-count": 162,
  "array-count": 0,
  "records": [
    {
      "id": 1003571,
      "product_code": "EK-M64-64-050",
      "product_name": "BERAS MENIR AYAK BERSIH 64 @ 50KG",
      "catname": "EKONOMI2 64",
      "catname_value": 1000067,
      "Weight": 50,
      "smalluom": "KG",
      "biguom": "ZAK"
      // ... additional fields
    }
  ]
}
```

### 7. Database Configuration

#### Sample Data Insertion
```sql
-- Insert test areas
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
```

### 8. First Run

#### Start Development Server
```bash
npm run dev
```

#### Access the Application
1. Open [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to Clerk's sign-in page
3. Create a new account or sign in
4. Complete the user profile setup

#### Create First Superadmin
Since the first user won't have admin access, you need to manually promote them:

```sql
-- Run this in Supabase SQL Editor
-- Replace 'user_xxxxxxxxxxxx' with your actual Clerk user ID
UPDATE user_profiles 
SET role = 'superadmin' 
WHERE clerk_user_id = 'user_xxxxxxxxxxxx';
```

### 9. Verify Installation

#### Check Database Connection
- Navigate to `/api/test-db` to verify database connectivity
- Should return a list of areas

#### Check Authentication
- Sign out and sign in again
- Verify profile data is saved correctly
- Check role assignment works

#### Test Admin Features
- Go to `/admin/users` (superadmin only)
- Go to `/admin/areas` (superadmin only)
- Create test users and areas

## Development Tools Setup

### IDE Configuration
For optimal development experience with **VS Code**:

#### Recommended Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "unifiedjs.vscode-mdx",
    "ms-vscode.vscode-json"
  ]
}
```

#### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  }
}
```

### Git Hooks (Optional)
```bash
# Install husky for pre-commit hooks
npm install --save-dev husky
npx husky install

# Add pre-commit linting
npx husky add .husky/pre-commit "npm run lint"
```

## Troubleshooting

### Common Issues

#### Environment Variables Not Loading
```bash
# Ensure .env.local is in the project root
# Restart the development server after changes
npm run dev
```

#### Database Connection Errors
```bash
# Verify Supabase URL and keys
# Check if Supabase project is active
# Ensure RLS policies are correctly set
```

#### Authentication Redirect Loops
```bash
# Check Clerk redirect URLs configuration
# Verify middleware.ts is correctly configured
# Clear browser cache and cookies
```

#### Permission Denied Errors
```bash
# Check user role in database
# Verify RLS policies allow the operation
# Ensure user is in correct area
```

### Getting Help

#### Check Logs
```bash
# Browser console for client-side errors
# Terminal for server-side errors
npm run dev

# Supabase logs in dashboard
# Clerk logs in dashboard
```

#### Debug API Endpoints
```bash
# Test endpoints directly
curl http://localhost:3000/api/test-db
curl http://localhost:3000/api/auth/profile
```

## Next Steps

1. **Read the [Authentication Guide](./03-AUTHENTICATION.md)** to understand the auth flow
2. **Review the [Database Schema](./04-DATABASE.md)** for data structure
3. **Explore [API Documentation](./05-API.md)** for endpoint details
4. **Check [UI Components Guide](./06-UI-COMPONENTS.md)** for component usage

## Production Deployment

For production deployment instructions, see [Deployment Guide](./07-DEPLOYMENT.md).