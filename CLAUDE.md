# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Common Development Tasks
- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Testing Commands
- No specific test commands are configured. The application uses Next.js with TypeScript and ESLint for code quality.
- Type checking is handled automatically during development and build processes.

## Architecture Overview

This is a Next.js 15 inventory dashboard application with the following key architectural components:

### Authentication & Authorization
- **Clerk**: Primary authentication provider handling user sign-in/sign-out
- **Role-based Access Control**: Three user roles with different permissions:
  - `superadmin`: Full access to user management, area management, and all inventory
  - `area sales manager`: Access to assigned area inventory only
  - `area sales supervisor`: View access to assigned area inventory only
- **User Profile Sync**: Automatic synchronization between Clerk users and Supabase user_profiles table

### Data Architecture
- **Supabase**: Primary PostgreSQL database with Row Level Security (RLS)
- **IndexedDB**: Client-side storage for finished goods data (offline capability)
- **iDempiere Integration**: External ERP system API for finished goods data
- **Data Flow**: iDempiere API → Supabase → IndexedDB (client-side) → React Components

### Key Components Structure
- **Layout Components**: `DashboardLayout.tsx`, `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`
- **Authentication Components**: `AuthGuard.tsx`, `RoleGuard.tsx`, `UserSyncWrapper.tsx`
- **Data Management**: `FinishedGoodsDataManager.tsx` (handles sync lifecycle)
- **UI Components**: shadcn/ui components in `src/components/ui/`
- **Custom Hooks**: `useFinishedGoods.ts`, `usePagination.ts`

### Database Schema
- `master_areas`: Area/region management
- `user_profiles`: User role and area assignments
- `raw_materials`: Raw material inventory
- `finished_goods`: Finished goods inventory

### API Routes Organization
- `/api/auth/*`: Authentication and user profile management
- `/api/inventory/*`: Inventory data retrieval
- `/api/finished-goods/*`: iDempiere integration for finished goods
- `/api/admin/*`: Superadmin-only management endpoints

## Important Development Patterns

### Authentication Flow
1. User signs in via Clerk
2. `UserSyncWrapper` syncs user to Supabase `user_profiles` table
3. `FinishedGoodsDataManager` handles finished goods data sync to IndexedDB
4. `RoleGuard` components enforce role-based access

### Data Synchronization
- **Automatic Sync**: Finished goods data syncs on user login (1-hour cache)
- **Manual Sync**: Available through UI controls
- **Data Clearance**: IndexedDB data cleared on user logout
- **Error Handling**: Comprehensive error handling for API failures

### Component Patterns
- **Loading States**: All data fetching operations include loading states
- **Error Boundaries**: Components handle errors gracefully with user feedback
- **Role Guards**: Protected routes use `RoleGuard` component
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### File Organization Conventions
- Page components in `src/app/` following Next.js App Router
- Reusable components in `src/components/` organized by feature
- Custom hooks in `src/hooks/`
- Utility functions in `src/lib/`
- TypeScript interfaces defined alongside their usage

### Environment Variables
Required environment variables (see `.env.local` template):
- Clerk authentication keys
- Supabase configuration
- iDempiere API credentials

## External Integrations

### iDempiere API
- Base URL: `NEXT_IDEMPIERE_URL` (typically https://ibpr.berasraja.com)
- Endpoint: `/api/v1/models/vw_product_fg`
- Authentication: Bearer token via `IDEMPIERE_TOKEN`
- Timeout: 30 seconds
- Error handling: Custom `IDempiereAPIError` class in `src/lib/idempiere-api.ts`
- Connection testing utility available via `testIDempiereConnection()`

### IndexedDB Management
- Database: `finished_goods_db`
- Stores: `finished_goods`, `categories`, `metadata`
- Automatic cleanup on logout
- Progress tracking during sync operations
- Database connection managed by `FinishedGoodsDataManager` component
- Sync metadata tracking to avoid duplicate syncs (1-hour cache)

## Security Considerations

### Row Level Security (RLS)
- All database tables have RLS enabled
- Users can only access data from their assigned area
- Superadmins have bypass access to all data

### Client-Side Data
- Sensitive data never stored in client-side storage
- IndexedDB only contains non-sensitive finished goods data
- Automatic data clearance on authentication changes