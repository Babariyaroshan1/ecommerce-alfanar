'use client';

import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

const CURRENCY_RATES = {
    INR: 1,
    KWD: 0.0037
};

const convertKwdToINR = (kwdValue) => {
    const numeric = Number(kwdValue);
    if (Number.isNaN(numeric)) return 0;
    return Number((numeric / CURRENCY_RATES.KWD).toFixed(2));
};

const getSavedCurrencySettings = () => ({
    country: 'India',
    currency: 'INR',
    symbol: '₹',
    shippingPriceKWD: 5,
    shippingPriceINR: convertKwdToINR(5),
    showKwdNavbarOption: false,
    showNewArrivalsNavbar: false
});

const normalizeCurrencySettings = (settings) => {
    const shippingPriceKWD = Number(settings?.shippingPriceKWD ?? settings?.shippingPrice ?? 5);
    const shippingPriceINR = Number(settings?.shippingPriceINR ?? convertKwdToINR(shippingPriceKWD));
    return {
        ...settings,
        shippingPriceKWD,
        shippingPriceINR,
        shippingPrice: shippingPriceKWD
    };
};

const getSavedSelectedCurrency = () => {
    if (typeof window === 'undefined') return 'KWD';
    try {
        return localStorage.getItem('selectedCurrency') || 'KWD';
    } catch (error) {
        return 'KWD';
    }
};

// Load products from localStorage (admin-added products)
const getLocalProducts = () => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem('adminProducts');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to load local products:', error);
        return [];
    }
};

// Save products to localStorage
const saveLocalProducts = (products) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('adminProducts', JSON.stringify(products));
    } catch (error) {
        console.error('Failed to save local products:', error);
    }
};

export const useProductStore = create((set, get) => ({
    products: [],
    loading: false,
    backendProducts: [],
    localProducts: [],
    currencySettings: getSavedCurrencySettings(),
    selectedCurrency: getSavedSelectedCurrency(),

    // Initialize store with products from backend or localStorage
    initializeProducts: async () => {
        set({ loading: true });
        const localProds = getLocalProducts();
        set({ localProducts: localProds });

        try {
            const response = await fetch(`${API_URL}/products`);
            if (response.ok) {
                const data = await response.json();
                const currencySettings = normalizeCurrencySettings(data.currencySettings || getSavedCurrencySettings());

                set({
                    backendProducts: data.products || data,
                    currencySettings,
                    products: [...(data.products || data), ...localProds],
                    loading: false,
                });
            } else {
                // Backend failed, show only local products
                set({
                    products: localProds,
                    loading: false,
                });
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            // Backend unavailable, show only local products
            set({
                products: localProds,
                loading: false,
            });
        }
    },

    // Initialize a limited set of products (fast startup)
    initializeLimitedProducts: async (limit = 8) => {
        set({ loading: true });
        const localProds = getLocalProducts();
        set({ localProducts: localProds });

        try {
            const response = await fetch(`${API_URL}/products?limit=${limit}`);
            if (response.ok) {
                const data = await response.json();
                const currencySettings = normalizeCurrencySettings(data.currencySettings || getSavedCurrencySettings());

                set({
                    backendProducts: data.products || data,
                    currencySettings,
                    products: [...(data.products || data), ...localProds],
                    loading: false,
                });
            } else {
                // Backend failed, show only local products
                set({
                    products: localProds,
                    loading: false,
                });
            }
        } catch (error) {
            console.error('Failed to fetch limited products:', error);
            set({
                products: localProds,
                loading: false,
            });
        }
    },

    setProducts: (products) => set({ products }),

    setCurrencySettings: (currencySettings) => {
        const normalizedSettings = normalizeCurrencySettings(currencySettings);
        if (typeof window !== 'undefined') {
            localStorage.setItem('currencySettings', JSON.stringify(normalizedSettings));
        }
        set({ currencySettings: normalizedSettings });
    },

    setSelectedCurrency: (currency) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedCurrency', currency);
        }
        set({ selectedCurrency: currency });
    },

    // Add product locally (for admin)
    addLocalProduct: (product) => {
        const state = get();
        const newLocalProducts = [...state.localProducts, product];
        saveLocalProducts(newLocalProducts);
        set({
            localProducts: newLocalProducts,
            products: [...state.backendProducts, ...newLocalProducts],
        });
    },

    // Add or update a product from the backend in the shared store
    addBackendProduct: (product) => {
        const state = get();
        const productId = String(product?._id || product?.id || `temp-${Date.now()}`);
        const normalizedProduct = {
            ...product,
            _id: productId,
            id: productId,
        };

        const existingBackendIndex = state.backendProducts.findIndex(
            (p) => String(p?._id || p?.id) === productId
        );

        const nextBackendProducts = existingBackendIndex >= 0
            ? state.backendProducts.map((p, index) =>
                index === existingBackendIndex ? { ...p, ...normalizedProduct } : p
            )
            : [...state.backendProducts, normalizedProduct];

        set({
            backendProducts: nextBackendProducts,
            products: [...nextBackendProducts, ...state.localProducts],
        });
    },

    // Delete product locally
    deleteProduct: (id) => {
        const state = get();
        const updatedLocal = state.localProducts.filter(
            (p) => String(p._id || p.id) !== String(id)
        );
        saveLocalProducts(updatedLocal);
        set({
            localProducts: updatedLocal,
            products: state.products.filter(
                (p) => String(p._id || p.id) !== String(id)
            ),
        });
    },

    // Update product
    updateProduct: (updatedProduct) => {
        const state = get();
        const updatedId = String(updatedProduct._id || updatedProduct.id);
        const isLocalProduct = state.localProducts.some(
            (p) => String(p._id || p.id) === updatedId
        );

        if (isLocalProduct) {
            const updatedLocal = state.localProducts.map((p) =>
                String(p._id || p.id) === updatedId
                    ? { ...p, ...updatedProduct }
                    : p
            );
            saveLocalProducts(updatedLocal);
            set({ localProducts: updatedLocal });
        } else {
            const updatedBackend = state.backendProducts.map((p) =>
                String(p._id || p.id) === updatedId
                    ? { ...p, ...updatedProduct }
                    : p
            );
            set({ backendProducts: updatedBackend });
        }

        set((currentState) => ({
            products: currentState.products.map((product) =>
                String(product._id || product.id) === updatedId
                    ? { ...product, ...updatedProduct }
                    : product
            ),
        }));
    },

    // Fetch products from backend
    fetchProducts: async () => {
        set({ loading: true });
        const state = get();

        try {
            const response = await fetch(`${API_URL}/products`);
            if (response.ok) {
                const data = await response.json();
                const currencySettings = normalizeCurrencySettings(data.currencySettings || getSavedCurrencySettings());

                set({
                    backendProducts: data.products || data,
                    currencySettings,
                    products: [...(data.products || data), ...state.localProducts],
                    loading: false,
                });
            } else {
                console.error('Product fetch failed with status:', response.status);
                // Show only local products
                set({
                    products: state.localProducts,
                    loading: false,
                });
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            // Backend down - show only local products
            set({
                products: state.localProducts,
                loading: false,
            });
        }
    },

    // Fetch filtered products from backend (with limit, category, featured, etc.)
    fetchFilteredProducts: async (params) => {
        // params = { limit: 8, featured: true, category: 'pajamas', isKidsProduct: true }
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/products?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                return data.products || data;
            }
            return [];
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    },
}));
