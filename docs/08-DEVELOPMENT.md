# Development Guide

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 18.17 or later
- **npm**: Version 9.0 or later (or yarn/pnpm equivalent)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Project Structure

### Directory Organization
```
project/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth route group
│   │   ├── admin/               # Admin pages
│   │   ├── api/                 # API routes
│   │   ├── dashboard/           # Dashboard pages
│   │   ├── inventory/           # Inventory pages
│   │   ├── settings/            # Settings pages
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/              # React components
│   │   ├── admin/               # Admin-specific components
│   │   ├── auth/                # Authentication components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── inventory/           # Inventory components
│   │   ├── layout/              # Layout components
│   │   ├── settings/            # Settings components
│   │   └── ui/                  # Base UI components (shadcn/ui)
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-mobile.ts        # Mobile detection hook
│   │   └── use-toast.ts         # Toast notification hook
│   ├── lib/                     # Utility libraries
│   │   ├── supabase.ts          # Supabase client configuration
│   │   └── utils.ts             # Utility functions
│   └── middleware.ts            # Next.js middleware
├── docs/                        # Documentation
├── public/                      # Static assets
├── database_schema.sql          # Initial database setup
├── database_migration.sql       # Schema migrations
├── .env.local                   # Environment variables
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── components.json              # shadcn/ui configuration
├── eslint.config.mjs            # ESLint configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.mjs           # PostCSS configuration
├── README.md                    # Project readme
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

### File Naming Conventions

#### Components
```typescript
// PascalCase for component files
UserManagementTable.tsx
AreaManagementTable.tsx
InventoryOverview.tsx

// camelCase for utility files
use-toast.ts
use-mobile.ts
supabase.ts
utils.ts
```

#### API Routes
```typescript
// Next.js App Router structure
api/
├── auth/
│   ├── profile/route.ts         # GET/PUT /api/auth/profile
│   └── sync-user/route.ts       # POST /api/auth/sync-user
├── admin/
│   ├── users/route.ts           # CRUD /api/admin/users
│   └── areas/route.ts           # CRUD /api/admin/areas
└── inventory/
    ├── overview/route.ts        # GET /api/inventory/overview
    └── raw-materials/route.ts   # GET /api/inventory/raw-materials
```

#### Pages
```typescript
// App Router structure
app/
├── (auth)/                      # Route group (doesn't affect URL)
│   ├── sign-in/page.tsx        # /sign-in
│   └── sign-up/page.tsx        # /sign-up
├── admin/
│   ├── users/page.tsx          # /admin/users
│   └── areas/page.tsx          # /admin/areas
├── dashboard/page.tsx          # /dashboard
└── page.tsx                    # / (home)
```

## Development Workflow

### 1. Setting Up New Features

#### Feature Branch Strategy
```bash
# Create feature branch
git checkout -b feature/user-management-enhancement
git checkout -b fix/area-deactivation-bug
git checkout -b docs/api-documentation

# Work on feature
git add .
git commit -m "feat: add user bulk operations"

# Push to remote
git push origin feature/user-management-enhancement
```

#### Commit Message Convention
```bash
# Format: <type>(<scope>): <description>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Code style (formatting, missing semicolons, etc.)
refactor: # Code refactoring
test:     # Adding or updating tests
chore:    # Maintenance tasks

# Examples:
feat(auth): add multi-factor authentication
fix(api): resolve user creation error handling
docs(database): update schema documentation
refactor(components): extract common table logic
test(api): add user management endpoint tests
chore(deps): update dependencies to latest versions
```

### 2. Development Commands

#### Daily Development
```bash
# Start development server
npm run dev

# Run with specific port
npm run dev -- --port 3001

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix

# Type checking
npx tsc --noEmit
```

#### Database Operations
```bash
# Reset local database
psql $DATABASE_URL -f database_schema.sql

# Apply migrations
psql $DATABASE_URL -f database_migration.sql

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Test database connection
curl http://localhost:3000/api/test-db
```

### 3. Code Quality Standards

#### TypeScript Configuration
```typescript
// tsconfig.json - Key settings
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict type checks
    "noUnusedLocals": true,           // Report unused local variables
    "noUnusedParameters": true,       // Report unused parameters
    "noImplicitReturns": true,        // Report missing return statements
    "noFallthroughCasesInSwitch": true, // Report fallthrough cases
    "exactOptionalPropertyTypes": true // Strict optional properties
  }
}
```

#### ESLint Rules
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // React specific
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      
      // General
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
    }
  }
];
```

#### Code Formatting with Prettier
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### 4. Component Development Guidelines

#### Component Structure Template
```typescript
// ComponentName.tsx
'use client'; // If client component

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Types
interface ComponentProps {
  prop1: string;
  prop2?: number;
  onAction?: (data: any) => void;
}

interface DataItem {
  id: string;
  name: string;
  // ... other properties
}

// Component
export function ComponentName({ prop1, prop2, onAction }: ComponentProps) {
  // State
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Computed values
  const filteredData = useMemo(() => {
    return data.filter(item => item.name.includes(prop1));
  }, [data, prop1]);
  
  // Effects
  useEffect(() => {
    fetchData();
  }, []);
  
  // Handlers
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAction = (item: DataItem) => {
    onAction?.(item);
    toast({
      title: "Success",
      description: "Action completed successfully",
    });
  };
  
  // Render helpers
  const renderItem = (item: DataItem) => (
    <div key={item.id} className="p-4 border rounded">
      <h3 className="font-medium">{item.name}</h3>
      <Button onClick={() => handleAction(item)}>
        Action
      </Button>
    </div>
  );
  
  // Loading state
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Error state
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  // Main render
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredData.map(renderItem)}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Custom Hook Pattern
```typescript
// hooks/use-data-fetching.ts
import { useState, useEffect } from 'react';

interface UseFetchOptions {
  immediate?: boolean;
  dependencies?: any[];
}

export function useFetch<T>(
  url: string, 
  options: UseFetchOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (options.immediate !== false) {
      fetchData();
    }
  }, options.dependencies || []);
  
  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Usage
const { data: users, loading, error, refetch } = useFetch<UserProfile[]>('/api/admin/users');
```

### 5. API Development Guidelines

#### API Route Template
```typescript
// app/api/resource/route.ts
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const CreateResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const UpdateResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// Helper functions
async function checkPermissions(userId: string, requiredRole: string = 'superadmin') {
  const { data: userProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_active')
    .eq('clerk_user_id', userId)
    .single();
    
  if (!userProfile?.is_active || userProfile.role !== requiredRole) {
    throw new Error('Insufficient permissions');
  }
  
  return userProfile;
}

// GET - List resources
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await checkPermissions(userId);
    
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('GET /api/resource error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Insufficient permissions' ? 403 : 500 }
    );
  }
}

// POST - Create resource
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await checkPermissions(userId);
    
    const body = await request.json();
    const validatedData = CreateResourceSchema.parse(body);
    
    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert(validatedData)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json(
      { data, message: 'Resource created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 422 }
      );
    }
    
    console.error('POST /api/resource error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update resource
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await checkPermissions(userId);
    
    const body = await request.json();
    const validatedData = UpdateResourceSchema.parse(body);
    const { id, ...updateData } = validatedData;
    
    const { data, error } = await supabaseAdmin
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json(
      { data, message: 'Resource updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/resource error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete resource
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await checkPermissions(userId);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const { error } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json(
      { message: 'Resource deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/resource error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 6. Database Development

#### Migration Script Template
```sql
-- migrations/YYYYMMDD_migration_name.sql
-- Migration: Add new feature
-- Date: 2024-01-01
-- Description: Brief description of changes

BEGIN;

-- 1. Add new columns
ALTER TABLE existing_table 
ADD COLUMN new_column VARCHAR(255),
ADD COLUMN another_column BOOLEAN DEFAULT FALSE;

-- 2. Create new tables
CREATE TABLE new_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    related_id INTEGER REFERENCES existing_table(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add indexes
CREATE INDEX idx_new_table_related_id ON new_table(related_id);
CREATE INDEX idx_existing_table_new_column ON existing_table(new_column) WHERE new_column IS NOT NULL;

-- 4. Update RLS policies
DROP POLICY IF EXISTS "old_policy" ON existing_table;
CREATE POLICY "new_policy" ON existing_table
    FOR SELECT USING (
        -- Updated policy logic
    );

-- 5. Insert default data
INSERT INTO new_table (name, related_id) VALUES 
    ('Default Item 1', 1),
    ('Default Item 2', 2);

-- 6. Update triggers
CREATE TRIGGER update_new_table_updated_at 
    BEFORE UPDATE ON new_table 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

#### Query Optimization Guidelines
```sql
-- Use EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE 
SELECT up.*, ma.name as area_name 
FROM user_profiles up
LEFT JOIN master_areas ma ON up.area_id = ma.id
WHERE up.is_active = true
AND ma.is_active = true;

-- Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_user_profiles_active_with_area 
ON user_profiles(is_active, area_id) 
WHERE is_active = true;

-- Use partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_master_areas_active 
ON master_areas(id) 
WHERE is_active = true;
```

### 7. Testing Strategy

#### Unit Testing Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

```typescript
// __tests__/components/UserManagementTable.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

// Mock API responses
const mockUsers = [
  {
    id: '1',
    clerk_user_id: 'user_123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'area sales manager',
    is_active: true,
  }
];

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: mockUsers }),
  })
) as jest.Mock;

describe('UserManagementTable', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders user list correctly', async () => {
    render(<UserManagementTable />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    render(<UserManagementTable />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    // Test page size change
    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    expect(pageSizeSelect).toHaveValue('10');
  });

  it('opens create user dialog', async () => {
    render(<UserManagementTable />);

    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add New User')).toBeInTheDocument();
  });
});
```

#### API Testing
```typescript
// __tests__/api/admin/users.test.ts
import { GET, POST } from '@/app/api/admin/users/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/supabase');

describe('/api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns users for superadmin', async () => {
      // Mock authenticated superadmin
      (auth as jest.Mock).mockResolvedValue({ userId: 'user_123' });
      
      // Mock database response
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockUsers);
    });

    it('returns 401 for unauthenticated requests', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      const response = await GET();

      expect(response.status).toBe(401);
    });
  });
});
```

### 8. Debug and Troubleshooting

#### Debug Configuration
```typescript
// next.config.ts - Development debugging
const nextConfig = {
  // Enable debugging in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Detailed error reporting
  experimental: {
    instrumentationHook: true,
  },
};
```

#### Logging Strategy
```typescript
// lib/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, data);
    }
  },
  
  info: (message: string, data?: any) => {
    console.log(`ℹ️ [INFO] ${message}`, data);
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [WARN] ${message}`, data);
  },
  
  error: (message: string, error?: Error | any) => {
    console.error(`❌ [ERROR] ${message}`, error);
  },
};

// Usage in API routes
export async function GET() {
  try {
    logger.info('Fetching users');
    
    const users = await fetchUsers();
    
    logger.debug('Users fetched successfully', { count: users.length });
    return NextResponse.json({ data: users });
  } catch (error) {
    logger.error('Failed to fetch users', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Common Debug Scenarios
```bash
# Database connection issues
curl http://localhost:3000/api/test-db

# Authentication issues
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/profile

# Check environment variables
npm run dev -- --debug

# TypeScript compilation issues
npx tsc --noEmit --pretty

# Build issues
npm run build 2>&1 | tee build.log
```

### 9. Performance Monitoring

#### Development Performance Tools
```typescript
// lib/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now();
    
    try {
      const result = await fn();
      const end = performance.now();
      
      console.log(`⏱️ ${name} took ${(end - start).toFixed(2)}ms`);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

// Usage
const users = await measurePerformance('Fetch Users', () =>
  supabaseAdmin.from('user_profiles').select('*')
);
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# Add to next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

This development guide provides comprehensive guidelines for maintaining code quality, implementing new features, and troubleshooting issues during development.