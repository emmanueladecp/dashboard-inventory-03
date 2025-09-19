# Application Overview

## Project Name
**Inventory Management Dashboard**

## Description
A comprehensive inventory management dashboard built with Next.js 15, featuring role-based access control, area-based inventory management, and administrative capabilities. The application is designed for organizations with multiple geographical or operational areas, allowing different roles to manage and view inventory data based on their permissions.

## Key Features

### 🔐 Authentication & Authorization
- **Clerk Authentication**: Secure user authentication with session management
- **Role-Based Access Control**: Three-tier role system
- **Area-Based Permissions**: Users access data based on assigned areas
- **Multi-Area Support**: Users can be assigned to multiple areas

### 📊 Inventory Management
- **Raw Materials Tracking**: Monitor raw material inventory by area
- **Finished Goods Management**: Track finished goods inventory
- **iDempiere ERP Integration**: Direct integration with external iDempiere system
- **IndexedDB Storage**: Client-side persistent storage for offline capability
- **Data Lifecycle Management**: Automatic sync on login, clear on logout
- **Advanced Search & Filtering**: Search by product name/code and filter by categories
- **Real-time Stock Levels**: Current stock information with units
- **Area-Specific Views**: Users see only relevant area data

### 👥 User Management (Superadmin Only)
- **User Creation**: Create new users with role and area assignment
- **Role Management**: Assign and modify user roles
- **Area Assignment**: Manage single and multiple area assignments
- **User Activation/Deactivation**: Control user access

### 🏢 Area Management (Superadmin Only)
- **Area Creation**: Create new operational areas
- **Area Configuration**: Set ERP IDs and naming
- **Area Activation/Deactivation**: Control area availability
- **Cascade Operations**: Smart user deactivation when areas are removed

### 📱 Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Responsive Dialogs**: Adaptive UI components
- **Touch-Friendly**: Optimized for touch interaction
- **Cross-Platform**: Works on all modern browsers

## User Roles

### 🔴 Superadmin
- **Full System Access**: Complete control over all features
- **User Management**: Create, modify, and deactivate users
- **Area Management**: Create and manage all areas
- **Global Inventory View**: Access to all area inventories
- **System Configuration**: Manage system-wide settings

### 🟡 Area Sales Manager
- **Area-Specific Access**: Access to assigned area(s) only
- **Inventory Overview**: View raw materials and finished goods
- **Team Visibility**: See team members in assigned areas
- **Dashboard Access**: Area-specific dashboard and reports

### 🟢 Area Sales Supervisor
- **Read-Only Access**: View-only permissions
- **Area Inventory**: View assigned area inventory
- **Basic Dashboard**: Limited dashboard functionality
- **No Administrative Rights**: Cannot modify data or users

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Lucide React**: Icon library

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Supabase**: PostgreSQL database with real-time features
- **Row Level Security**: Database-level access control
- **Clerk**: Authentication and user management

### Development Tools
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Zod**: Runtime schema validation
- **React Hook Form**: Form state management

## Architecture Principles

### 🏗️ Security-First Design
- **Zero Trust Architecture**: Verify every request
- **Row Level Security**: Database-level permission enforcement
- **Role-Based Access**: Granular permission system
- **Secure API Endpoints**: Authenticated and authorized routes

### 📈 Scalable Structure
- **Modular Components**: Reusable UI components
- **Clean API Design**: RESTful endpoint structure
- **Efficient Database Queries**: Optimized data fetching
- **Performance Optimized**: Fast loading and responsive UI

### 🔄 Data Consistency
- **Dual Authentication**: Clerk + Supabase integration
- **Transaction Safety**: Atomic operations for critical updates
- **Cascade Operations**: Proper handling of related data
- **Data Integrity**: Foreign key constraints and validation

## Project Structure
```
project/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   ├── admin/          # Admin interfaces
│   │   ├── dashboard/      # Main dashboard
│   │   ├── inventory/      # Inventory views
│   │   └── settings/       # User settings
│   ├── components/         # React components
│   │   ├── admin/          # Admin components
│   │   ├── auth/           # Authentication
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── inventory/      # Inventory tables
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Base UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and config
│   └── middleware.ts       # Route protection
├── docs/                   # Documentation
├── database_schema.sql     # Initial database setup
├── database_migration.sql  # Schema updates
└── README.md              # Project readme
```

## Getting Started
See [Setup Guide](./02-SETUP.md) for detailed installation and configuration instructions.

## Core Functionality
- [Authentication System](./03-AUTHENTICATION.md)
- [Database Schema](./04-DATABASE.md)
- [API Endpoints](./05-API.md)
- [User Interface](./06-UI-COMPONENTS.md)
- [Deployment Guide](./07-DEPLOYMENT.md)

## Development Guidelines
- [Development Workflow](./08-DEVELOPMENT.md)
- [Testing Strategy](./09-TESTING.md)
- [Security Considerations](./10-SECURITY.md)