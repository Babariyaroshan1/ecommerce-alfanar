# Role-Based Access Control (RBAC) Implementation

## Overview

Your e-commerce application now has a complete **Role-Based Access Control (RBAC)** system that restricts co-admin permissions while keeping full admin access.

## Architecture

### User Roles
- **Admin** (`isAdmin: true`, `role: 'admin'`) - Full system access
- **Co-Admin** (`role: 'coadmin'`) - Limited access based on assigned permissions
- **User** (`role: 'user'`) - Regular customer account

### Available Permissions

| Permission Key | Label | Description |
|---|---|---|
| `manage_products` | Manage Products | Add, edit, and delete products |
| `manage_orders` | Manage Orders | View and update order status |
| `manage_users` | Manage Users | View user information |
| `view_analytics` | View Analytics | Access sales and performance data |
| `manage_content` | Manage Content | Edit website content and banners |
| `manage_settings` | Manage Settings | Manage system settings and currency |

## Implementation Details

### Files Modified/Created

1. **[backend/utils/permissions.js](backend/utils/permissions.js)** - NEW
   - Centralized permission definitions
   - Permission metadata with labels and descriptions
   - Default co-admin permissions template

2. **[backend/middleware/auth.js](backend/middleware/auth.js)** - UPDATED
   - Enhanced `permissionAuth()` middleware for fine-grained permission checks
   - Admins bypass permission checks (full access)
   - Co-admins checked against `User.permissions` array

3. **[backend/routes/products.js](backend/routes/products.js)** - UPDATED
   - PUT (edit) route: requires `manage_products` permission
   - POST (create) route: requires `manage_products` permission
   - DELETE route: requires `manage_products` permission

4. **[backend/routes/orders.js](backend/routes/orders.js)** - UPDATED
   - GET /admin/all: requires `manage_orders` permission
   - GET /admin/requests: requires `manage_orders` permission
   - GET /admin/user/:userId/orders: requires `manage_orders` permission

5. **[backend/routes/auth.js](backend/routes/auth.js)** - UPDATED
   - GET /admin/users: requires `manage_users` permission
   - GET /admin/users/:id: requires `manage_users` permission

6. **[backend/controllers/settingsController.js](backend/controllers/settingsController.js)** - UPDATED
   - Uses centralized `PERMISSION_METADATA` constant
   - Unchanged API endpoints (still admin-only)

## How It Works

### Authentication Flow

```
Request → Auth Middleware → Token Verification
                          ↓
                    Check Role/Status
                    ├─ If Admin → Grant Access (Skip Permission Check)
                    ├─ If Co-Admin → Check Specific Permission
                    │               ├─ Permission Exists → Grant Access
                    │               └─ Permission Missing → Return 403
                    └─ If User → Return 403 (Insufficient Permissions)
```

### Example: Co-Admin Product Management

A co-admin with `manage_products` permission:
- ✅ Can view all products (no auth required)
- ✅ Can edit existing products
- ✅ Can add new products
- ✅ Can delete products
- ❌ Cannot view orders (no `manage_orders` permission)
- ❌ Cannot view all users (no `manage_users` permission)

## Managing Co-Admin Permissions

### API Endpoints

#### 1. Get All Co-Admins
```
GET /api/settings/coadmins
Authorization: Bearer <admin-token>
```

Response:
```json
[
  {
    "_id": "69ef2d4c5241cb13c7bf6615",
    "name": "Co-Admin",
    "email": "coadmin@noor.com",
    "role": "coadmin",
    "permissions": ["manage_products", "manage_orders"]
  }
]
```

#### 2. Get Available Permissions
```
GET /api/settings/permissions
Authorization: Bearer <admin-token>
```

Response:
```json
[
  {
    "key": "manage_products",
    "label": "Manage Products",
    "description": "Add, edit, and delete products"
  },
  {
    "key": "manage_orders",
    "label": "Manage Orders",
    "description": "View and update order status"
  },
  // ... more permissions
]
```

#### 3. Update Co-Admin Permissions
```
PUT /api/settings/coadmin-permissions
Authorization: Bearer <admin-token>

{
  "coadminId": "69ef2d4c5241cb13c7bf6615",
  "permissions": ["manage_products"]
}
```

Response:
```json
{
  "message": "Permissions updated successfully"
}
```

## Frontend Implementation Example

### Get Available Permissions and Co-Admins

```javascript
// Fetch co-admins
const response = await fetch('/api/settings/coadmins', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const coadmins = await response.json();

// Fetch available permissions
const permResponse = await fetch('/api/settings/permissions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const permissions = await permResponse.json();
```

### Update Co-Admin Permissions

```javascript
async function updateCoadminPermissions(coadminId, selectedPermissions) {
  const response = await fetch('/api/settings/coadmin-permissions', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      coadminId,
      permissions: selectedPermissions
    })
  });
  
  const data = await response.json();
  if (response.ok) {
    console.log('Permissions updated:', data.message);
  }
}
```

## Security Considerations

1. **Admin Always Has Access**: Admins bypass all permission checks
2. **Co-Admin Restrictions**: Co-admins must have explicit permissions for each action
3. **Permission Inheritance**: Permissions are stored in `User.permissions` array
4. **Token-Based Auth**: Permissions are checked server-side on every request
5. **No Client-Side Permission**: UI should fetch available actions, but server enforces

## Adding New Permissions

1. Add to [backend/utils/permissions.js](backend/utils/permissions.js):
```javascript
export const PERMISSIONS = {
  // ... existing
  NEW_FEATURE: 'new_feature'
};

export const PERMISSION_METADATA = [
  // ... existing
  {
    key: PERMISSIONS.NEW_FEATURE,
    label: 'Feature Label',
    description: 'Feature description'
  }
];
```

2. Import and use in routes:
```javascript
import { permissionAuth } from '../middleware/auth.js';
import { PERMISSIONS } from '../utils/permissions.js';

router.put('/route', permissionAuth(PERMISSIONS.NEW_FEATURE), handler);
```

## Testing the System

### Test Case 1: Admin Access
- Admin can perform all operations (product CRUD, view orders, etc.)
- No permission errors

### Test Case 2: Co-Admin with Limited Permissions
- Co-admin can only perform operations they have permissions for
- Get 403 error for operations without permission
- Example: Co-admin without `manage_orders` trying to view orders → 403 Forbidden

### Test Case 3: User Access
- Regular users cannot access admin endpoints
- Get 403 error for all `/admin/*` routes

## Current Status

✅ **Complete Implementation**
- Permission system centralized
- All protected routes updated
- Co-admin permission checks enforced
- API endpoints ready for frontend integration

**Next Steps:**
1. Update frontend admin panel to show permission management UI
2. Add co-admin registration with permission assignment
3. Monitor and log permission-based access for auditing
