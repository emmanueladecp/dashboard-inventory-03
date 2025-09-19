# Inventory Dashboard

A modern web application for monitoring stock quantities of raw materials and finished goods with role-based access control.

## Features

- **Real-time Inventory Monitoring**: Track stock levels for raw materials and finished goods
- **External API Integration**: Seamless integration with iDempiere ERP system for finished goods
- **Client-side Data Persistence**: IndexedDB storage for offline-capable finished goods data
- **Role-based Access Control**: Three user roles with different permissions
  - Superadmin: Full access to user management, area management, and all inventory
  - Area Sales Manager: Access to assigned area inventory and team management
  - Area Sales Supervisor: View access to assigned area inventory
- **User Management**: Superadmins can assign roles and areas to users
- **Area Management**: Manage different geographical or organizational areas
- **Data Lifecycle Management**: Automatic data sync on login, clear on logout
- **Advanced Search & Filtering**: Search by product name/code and filter by categories
- **Responsive Design**: Mobile-first approach with responsive UI
- **Secure Authentication**: Powered by Clerk with user profile synchronization

## Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Clerk account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dashboard_03/project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project directory:
   ```env
   # Clerk Configuration
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # iDempiere API Configuration
   NEXT_IDEMPIERE_URL=https://ibpr.berasraja.com
   IDEMPIERE_TOKEN=your_idempiere_jwt_token
   ```

4. **Set up the database**
   Run the SQL commands from `database_schema.sql` in your Supabase SQL editor to create the required tables and sample data.

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses four main tables:

- **master_areas**: Stores area information
- **user_profiles**: User profile data with role and area assignments
- **raw_materials**: Raw material inventory data
- **finished_goods**: Finished goods inventory data

## User Roles and Permissions

| Role | Dashboard | Inventory View | User Management | Area Management |
|------|-----------|----------------|-----------------|----------------|
| Superadmin | ✅ All areas | ✅ All areas | ✅ | ✅ |
| Area Sales Manager | ✅ Assigned area | ✅ Assigned area | ❌ | ❌ |
| Area Sales Supervisor | ✅ Assigned area | ✅ Assigned area | ❌ | ❌ |

## API Endpoints

### Authentication
- `POST /api/auth/sync-user` - Sync Clerk user to database
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/check-user` - Check if user exists

### Inventory
- `GET /api/inventory/overview` - Get inventory overview statistics
- `GET /api/inventory/raw-materials` - Get raw materials list
- `GET /api/inventory/finished-goods` - Get finished goods list

### Finished Goods (iDempiere Integration)
- `GET /api/finished-goods/sync` - Fetch finished goods from iDempiere API
- `POST /api/finished-goods/sync` - Manually trigger sync of finished goods data

### Admin (Superadmin only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users` - Update user role/area
- `GET /api/admin/areas` - Get all areas
- `POST /api/admin/areas` - Create new area
- `PUT /api/admin/areas` - Update area

## Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── api/                # API routes
│   ├── admin/              # Admin pages (superadmin only)
│   ├── dashboard/          # Main dashboard
│   ├── inventory/          # Inventory pages
│   └── settings/           # Settings page
├── components/             # React components
│   ├── admin/              # Admin-specific components
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Dashboard components
│   ├── inventory/          # Inventory components
│   ├── layout/             # Layout components
│   ├── settings/           # Settings components
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
└── middleware.ts           # Clerk middleware
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure no TypeScript errors
5. Submit a pull request

## License

This project is licensed under the MIT License.
