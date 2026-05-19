// Define all available permissions
export const PERMISSIONS = {
    MANAGE_PRODUCTS: 'manage_products',
    MANAGE_ORDERS: 'manage_orders',
    MANAGE_USERS: 'manage_users',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_CONTENT: 'manage_content',
    MANAGE_SETTINGS: 'manage_settings'
};

// Permission metadata with labels and descriptions
export const PERMISSION_METADATA = [
    {
        key: PERMISSIONS.MANAGE_PRODUCTS,
        label: 'Manage Products',
        description: 'Add, edit, and delete products'
    },
    {
        key: PERMISSIONS.MANAGE_ORDERS,
        label: 'Manage Orders',
        description: 'View and update order status'
    },
    {
        key: PERMISSIONS.MANAGE_USERS,
        label: 'Manage Users',
        description: 'View user information'
    },
    {
        key: PERMISSIONS.VIEW_ANALYTICS,
        label: 'View Analytics',
        description: 'Access sales and performance data'
    },
    {
        key: PERMISSIONS.MANAGE_CONTENT,
        label: 'Manage Content',
        description: 'Edit website content and banners'
    },
    {
        key: PERMISSIONS.MANAGE_SETTINGS,
        label: 'Manage Settings',
        description: 'Manage system settings and currency'
    }
];

// Default permissions for co-admins (can be customized)
export const DEFAULT_COADMIN_PERMISSIONS = [
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.MANAGE_USERS
];
