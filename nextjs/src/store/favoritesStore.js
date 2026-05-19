import { create } from 'zustand';

const getProductKey = (item) => String(item?._id ?? item?.id ?? '');

export const useFavoritesStore = create((set) => ({
    favorites: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('favorites')) || [] : [],

    addToFavorites: (product) => set((state) => {
        const key = getProductKey(product);
        const exists = state.favorites.some(item => getProductKey(item) === key);
        if (exists) return state;
        const newFavorites = [...state.favorites, product];
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        return { favorites: newFavorites };
    }),

    removeFromFavorites: (productId) => set((state) => {
        const key = String(productId);
        const newFavorites = state.favorites.filter(item => getProductKey(item) !== key);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        return { favorites: newFavorites };
    }),

    toggleFavorite: (product) => set((state) => {
        const key = getProductKey(product);
        const exists = state.favorites.some(item => getProductKey(item) === key);
        const newFavorites = exists
            ? state.favorites.filter(item => getProductKey(item) !== key)
            : [...state.favorites, product];
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        return { favorites: newFavorites };
    }),
}));
