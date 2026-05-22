const BASE_URL = 'https://www.alfanar.store';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fetch dynamic products
async function getProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            console.warn('Failed to fetch products for sitemap');
            return [];
        }

        const products = await response.json();
        return products.map((product) => ({
            url: `${BASE_URL}/product/${product._id || product.id}`,
            lastModified: product.updatedAt || product.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));
    } catch (error) {
        console.error('Error fetching products for sitemap:', error);
        return [];
    }
}

// Fetch categories (if available)
async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) return [];

        const categories = await response.json();
        return categories.map((cat) => ({
            url: `${BASE_URL}/category/${cat.slug || cat._id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));
    } catch (error) {
        console.warn('Categories API not available');
        return [];
    }
}

export default async function sitemap() {
    const [products, categories] = await Promise.all([
        getProducts(),
        getCategories(),
    ]);

    return [
        // Static pages - Core
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/products`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/kids`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/new-arrivals`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },

        // Static pages - Account & Legal
        {
            url: `${BASE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/cart`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/orders`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },

        // Dynamic products
        ...products,

        // Dynamic categories
        ...categories,
    ];
}
