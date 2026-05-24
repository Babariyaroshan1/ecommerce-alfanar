// Define all available permissions
export const PERMISSIONS = {
    MANAGE_PRODUCTS: 'manage_products',
    MANAGE_KIDS_PRODUCTS: 'manage_kids_products',
    MANAGE_ORDERS: 'manage_orders',
    MANAGE_USERS: 'manage_users',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_CONTENT: 'manage_content',
    MANAGE_FAQS: 'manage_faqs',
    MANAGE_PRODUCT_FAQS: 'manage_product_faqs',
    MANAGE_REVIEWS: 'manage_reviews',
    MANAGE_BANNER: 'manage_banner',
    MANAGE_CURRENCY: 'manage_currency',
    MANAGE_COUPONS: 'manage_coupons',
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
        key: PERMISSIONS.MANAGE_KIDS_PRODUCTS,
        label: 'Manage Kids Products',
        description: 'Add, edit, and delete kids products'
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
        key: PERMISSIONS.MANAGE_FAQS,
        label: 'Manage FAQs',
        description: 'Add, edit, and delete FAQ entries'
    },
    {
        key: PERMISSIONS.MANAGE_PRODUCT_FAQS,
        label: 'Manage Product FAQs',
        description: 'Add, edit, and delete product-specific FAQs'
    },
    {
        key: PERMISSIONS.MANAGE_REVIEWS,
        label: 'Manage Reviews',
        description: 'View and manage product reviews'
    },
    {
        key: PERMISSIONS.MANAGE_BANNER,
        label: 'Manage Banner',
        description: 'Update website banner and images'
    },
    {
        key: PERMISSIONS.MANAGE_CURRENCY,
        label: 'Manage Currency',
        description: 'Configure currency settings and rates'
    },
    {
        key: PERMISSIONS.MANAGE_COUPONS,
        label: 'Manage Coupons',
        description: 'Create and manage discount coupons'
    },
    {
        key: PERMISSIONS.MANAGE_SETTINGS,
        label: 'Manage Settings',
        description: 'Manage system settings and permissions'
    }
];

// Default permissions for co-admins (can be customized)
export const DEFAULT_COADMIN_PERMISSIONS = [
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.MANAGE_USERS
];
