# API Endpoints Documentation

## Overview

The application provides a comprehensive REST API built with Next.js App Router. All endpoints are secured with authentication and role-based authorization. The API follows RESTful principles with consistent error handling and response formats.

## Base Configuration

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

### Response Format
```typescript
// Success Response
{
  "data": any,
  "message"?: string,
  "status": number
}

// Error Response
{
  "error": string,
  "details"?: any,
  "status": number
}
```

## Authentication Endpoints

### Check User Existence
**GET** `/api/auth/check-user`

Checks if the authenticated user exists in the database.

**Response**:
```json
{
  "exists": true,
  "user": {
    "id": "uuid",
    "clerk_user_id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "area sales manager",
    "area_id": 1,
    "is_active": true,
    "master_areas": {
      "id": 1,
      "name": "North Zone",
      "erp_id": 1001
    }
  }
}
```

### Sync User Profile
**POST** `/api/auth/sync-user`

Synchronizes Clerk user data with the database profile.

**Request Body**:
```json
{
  "clerkUserId": "user_123",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**Response**:
```json
{
  "message": "User profile synchronized successfully",
  "data": {
    "id": "uuid",
    "clerk_user_id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "area sales supervisor",
    "is_active": true
  }
}
```

### Get User Profile
**GET** `/api/auth/profile`

Retrieves the current user's profile information.

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "clerk_user_id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "area sales manager",
    "area_id": 1,
    "is_active": true,
    "master_areas": {
      "id": 1,
      "name": "North Zone",
      "erp_id": 1001
    }
  }
}
```

### Update User Profile
**PUT** `/api/auth/profile`

Updates the current user's profile information.

**Request Body**:
```json
{
  "full_name": "John Smith",
  "email": "john.smith@example.com"
}
```

## Inventory Endpoints

### Get Inventory Overview
**GET** `/api/inventory/overview`

Provides inventory statistics for the user's assigned areas.

**Response**:
```json
{
  "data": {
    "totalRawMaterials": 15,
    "totalFinishedGoods": 8,
    "lowStockItems": 3,
    "areas": [
      {
        "id": 1,
        "name": "North Zone",
        "rawMaterialsCount": 10,
        "finishedGoodsCount": 5
      }
    ]
  }
}
```

### Get Raw Materials
**GET** `/api/inventory/raw-materials`

Retrieves raw materials for user's assigned areas.

**Query Parameters**:
- `area_id` (optional): Filter by specific area

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Steel Bars",
      "erp_id": 2001,
      "current_stock": 150,
      "unit": "kg",
      "area_id": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "master_areas": {
        "id": 1,
        "name": "North Zone",
        "erp_id": 1001
      }
    }
  ]
}
```

### Get Finished Goods
**GET** `/api/inventory/finished-goods`

Retrieves finished goods for user's assigned areas.

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Product A",
      "erp_id": 3001,
      "current_stock": 50,
      "unit": "pieces",
      "area_id": 1,
      "master_areas": {
```

## iDempiere Integration Endpoints

### Sync Finished Goods from iDempiere
**GET** `/api/finished-goods/sync`

Fetches finished goods data from the external iDempiere ERP system.

**Authentication**: Required (Clerk JWT)
**Authorization**: Any authenticated user

**Response**:
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
      "AD_Client_ID": {
        "propertyLabel": "Client",
        "id": 1000003,
        "identifier": "Belitang",
        "model-name": "ad_client"
      },
      "product_code": "EK-M64-64-050",
      "product_name": "BERAS MENIR AYAK BERSIH 64 @ 50KG",
      "catname": "EKONOMI2 64",
      "catname_value": 1000067,
      "parent1": "FINISH GOODS EKONOMIS",
      "parent2": "Finish Goods",
      "Weight": 50,
      "smalluom": "KG",
      "biguom": "ZAK"
    }
  ]
}
```

**Error Responses**:
```json
// Unauthorized
{
  "error": "Unauthorized. Please sign in to access finished goods.",
  "status": 401
}

// iDempiere API Error
{
  "error": "Failed to fetch finished goods from iDempiere: HTTP error! status: 500",
  "details": "Check server logs for details",
  "status": 500
}

// Configuration Error
{
  "error": "Missing iDempiere configuration. Please check NEXT_IDEMPIERE_URL and IDEMPIERE_TOKEN environment variables.",
  "status": 500
}
```

### Manual Sync Trigger
**POST** `/api/finished-goods/sync`

Manually triggers a sync of finished goods data from iDempiere.

**Authentication**: Required (Clerk JWT)
**Authorization**: Any authenticated user

**Response**:
```json
{
  "message": "Finished goods sync completed successfully",
  "data": {
    "page-count": 1,
    "records-size": 3000,
    "row-count": 162,
    "records": [...]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Get Finished Goods
**GET** `/api/inventory/finished-goods`

Retrieves finished goods for user's assigned areas.

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Product A",
      "erp_id": 3001,
      "current_stock": 50,
      "unit": "pieces",
      "area_id": 1,
      "master_areas": {
        "id": 1,
        "name": "North Zone",
        "erp_id": 1001
      }
    }
  ]
}
```

## Admin Endpoints (Superadmin Only)

### User Management

#### List All Users
**GET** `/api/admin/users`

Retrieves all users in the system.

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "clerk_user_id": "user_123",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "area sales manager",
      "area_id": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "master_areas": {
        "id": 1,
        "name": "North Zone",
        "erp_id": 1001
      }
    }
  ]
}
```

#### Create New User
**POST** `/api/admin/create-user`

Creates a new user with Clerk and database integration.

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",      // optional
  "fullName": "John Doe",           // optional
  "areaId": 1                       // optional
}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "clerk_user_id": "user_456",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "area sales supervisor",
    "area_id": 1,
    "is_active": true
  },
  "tempPassword": "temp_password_123",
  "message": "User created successfully"
}
```

#### Update User
**PUT** `/api/admin/users`

Updates user role and area assignment.

**Request Body**:
```json
{
  "userProfileId": "uuid",
  "role": "area sales manager",
  "areaId": 2
}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "role": "area sales manager",
    "area_id": 2,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "User updated successfully"
}
```

#### Activate/Deactivate User
**PATCH** `/api/admin/users`

Activates or deactivates a user account.

**Request Body**:
```json
{
  "userProfileId": "uuid",
  "isActive": false
}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "is_active": false,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "User deactivated successfully"
}
```

### Area Management

#### List All Areas
**GET** `/api/admin/areas`

Retrieves all areas in the system.

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "North Zone",
      "erp_id": 1001,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create New Area
**POST** `/api/admin/areas`

Creates a new area.

**Request Body**:
```json
{
  "name": "Northeast Zone",
  "erpId": 1006
}
```

**Response**:
```json
{
  "data": {
    "id": 6,
    "name": "Northeast Zone",
    "erp_id": 1006,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Area created successfully"
}
```

#### Update Area
**PUT** `/api/admin/areas`

Updates area details.

**Request Body**:
```json
{
  "id": 1,
  "name": "North Zone Updated",
  "erpId": 1001
}
```

**Response**:
```json
{
  "data": {
    "id": 1,
    "name": "North Zone Updated",
    "erp_id": 1001,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Area updated successfully"
}
```

#### Activate/Deactivate Area
**PATCH** `/api/admin/areas`

Activates or deactivates an area with cascade user handling.

**Request Body**:
```json
{
  "id": 1,
  "isActive": false
}
```

**Response**:
```json
{
  "data": {
    "id": 1,
    "is_active": false,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Area deactivated successfully. All user assignments to this area have been removed and users with no remaining active areas have been deactivated."
}
```

### User Area Mappings

#### Get User Area Mappings
**GET** `/api/admin/user-area-mappings?userProfileId=uuid`

Retrieves all area mappings for a specific user.

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "user_profile_id": "uuid",
      "area_id": 2,
      "created_at": "2024-01-01T00:00:00Z",
      "master_areas": {
        "id": 2,
        "name": "South Zone",
        "erp_id": 1002,
        "is_active": true
      }
    }
  ]
}
```

#### Create User Area Mapping
**POST** `/api/admin/user-area-mappings`

Assigns a user to an additional area.

**Request Body**:
```json
{
  "userProfileId": "uuid",
  "areaId": 3
}
```

**Response**:
```json
{
  "data": {
    "id": 2,
    "user_profile_id": "uuid",
    "area_id": 3,
    "created_at": "2024-01-01T00:00:00Z",
    "master_areas": {
      "id": 3,
      "name": "East Zone",
      "erp_id": 1003,
      "is_active": true
    }
  },
  "message": "Area mapping created successfully"
}
```

#### Remove User Area Mapping
**DELETE** `/api/admin/user-area-mappings`

Removes a user's additional area assignment.

**Request Body**:
```json
{
  "userProfileId": "uuid",
  "areaId": 3
}
```

**Response**:
```json
{
  "message": "Area mapping removed successfully"
}
```

## Utility Endpoints

### Test Database Connection
**GET** `/api/test-db`

Tests database connectivity and returns sample data.

**Response**:
```json
{
  "message": "Database connection successful",
  "areas": [
    {
      "id": 1,
      "name": "North Zone",
      "erp_id": 1001
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

### Common Error Codes

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden: Superadmin access required",
  "status": 403
}
```

#### 404 Not Found
```json
{
  "error": "User not found",
  "status": 404
}
```

#### 409 Conflict
```json
{
  "error": "ERP ID already exists",
  "status": 409
}
```

#### 422 Validation Error
```json
{
  "error": "Validation failed",
  "details": {
    "username": "Username is required",
    "areaId": "Invalid area ID"
  },
  "status": 422
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Database connection failed",
  "status": 500
}
```

## Rate Limiting

### Current Limits
- **Authentication endpoints**: 10 requests/minute per IP
- **Admin endpoints**: 30 requests/minute per user
- **Inventory endpoints**: 60 requests/minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## API Testing

### Using cURL

#### Test Public Endpoint
```bash
curl -X GET http://localhost:3000/api/test-db
```

#### Test Authenticated Endpoint
```bash
curl -X GET \
  -H "Authorization: Bearer <jwt-token>" \
  http://localhost:3000/api/auth/profile
```

#### Test Admin Endpoint
```bash
curl -X GET \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/admin/users
```

#### Create User
```bash
curl -X POST \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "areaId": 1
  }' \
  http://localhost:3000/api/admin/create-user
```

### Using Postman

#### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "jwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "adminToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Collection Structure
```
📁 Inventory Dashboard API
├── 📁 Authentication
│   ├── GET Check User
│   ├── POST Sync User
│   ├── GET User Profile
│   └── PUT Update Profile
├── 📁 Inventory
│   ├── GET Overview
│   ├── GET Raw Materials
│   └── GET Finished Goods
├── 📁 Admin - Users
│   ├── GET List Users
│   ├── POST Create User
│   ├── PUT Update User
│   └── PATCH Toggle User Status
├── 📁 Admin - Areas
│   ├── GET List Areas
│   ├── POST Create Area
│   ├── PUT Update Area
│   └── PATCH Toggle Area Status
└── 📁 Admin - User Area Mappings
    ├── GET User Mappings
    ├── POST Create Mapping
    └── DELETE Remove Mapping
```

## Security Considerations

### Input Validation
- All inputs are validated using Zod schemas
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization

### Authentication
- JWT tokens verified on every request
- Clerk session validation
- Automatic token refresh

### Authorization
- Role-based access control
- Area-based data filtering
- Row Level Security at database level

### Data Protection
- Sensitive data excluded from responses
- Password hashing for temporary passwords
- Audit logging for admin actions

## Performance Optimization

### Caching Strategy
- Database query result caching
- Static asset caching
- API response caching for non-real-time data

### Query Optimization
- Efficient database indexes
- Optimized JOIN queries
- Pagination for large datasets

### Response Optimization
- Selective field inclusion
- Compressed responses
- Efficient JSON serialization

## API Versioning

### Current Version: v1
All endpoints are currently unversioned but follow v1 conventions.

### Future Versioning Strategy
```
/api/v1/auth/profile
/api/v1/inventory/overview
/api/v1/admin/users
```

### Deprecation Policy
- 6-month notice for breaking changes
- Backward compatibility maintenance
- Clear migration documentation

## Monitoring and Logging

### Request Logging
```typescript
// Example log format
{
  "timestamp": "2024-01-01T00:00:00Z",
  "method": "GET",
  "url": "/api/admin/users",
  "userId": "user_123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "responseTime": 150,
  "statusCode": 200
}
```

### Error Tracking
- Automatic error reporting
- Stack trace capture
- User context inclusion
- Performance impact monitoring

### Metrics Collection
- Request count by endpoint
- Response time percentiles
- Error rate tracking
- User activity patterns