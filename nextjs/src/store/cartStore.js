import { create } from 'zustand';

const getProductId = (product) => product?._id ?? product?.id;

export const useCartStore = create((set, get) => ({
    cart: (() => {
        if (typeof window === 'undefined') return [];
        const storedCart = localStorage.getItem('cart');
        const stored = storedCart ? JSON.parse(storedCart) : [];
        // Migrate old items to have selected options
        const migrated = stored.map(item => ({
            ...item,
            selectedColor: item.selectedColor || 'Default',
            selectedSize: item.selectedSize || 'One Size',
            quantity: Number(item.quantity) || 1
        }));
        if (migrated.length !== stored.length || migrated.some((item, i) => item.selectedColor !== stored[i].selectedColor || item.selectedSize !== stored[i].selectedSize)) {
            localStorage.setItem('cart', JSON.stringify(migrated));
        }
        return migrated;
    })(),

    appliedCoupon: (() => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem('appliedCoupon');
        return stored ? JSON.parse(stored) : null;
    })(),

    addToCart: (product, maxStock) => set((state) => {
        const incomingId = getProductId(product);
        const incomingColor = product.selectedColor || 'Default';
        const incomingSize = product.selectedSize || 'One Size';
        const incomingQty = product.quantity || 1;

        // Find existing item in cart
        const existingItem = state.cart.find(item =>
            getProductId(item) === incomingId &&
            (item.selectedSize || 'One Size') === incomingSize &&
            (item.selectedColor || 'Default') === incomingColor
        );

        // Get current quantity in cart for this item
        const currentCartQty = existingItem ? existingItem.quantity : 0;
        const totalQty = currentCartQty + incomingQty;

        // Use provided maxStock or fallback to product.stock or 1
        const stockLimit = maxStock || product.stock || 1;

        if (totalQty > stockLimit) {
            console.warn(`Cannot add ${incomingQty} items. Stock limit is ${stockLimit}, current cart has ${currentCartQty}`);
            alert(`Cannot add more items. Only ${stockLimit} items available in stock.`);
            return state; // Don't add if it exceeds stock
        }

        let newCart;

        if (existingItem) {
            newCart = state.cart.map(item =>
                (getProductId(item) === incomingId &&
                    (item.selectedSize || 'One Size') === incomingSize &&
                    (item.selectedColor || 'Default') === incomingColor)
                    ? { ...item, quantity: item.quantity + incomingQty }
                    : item
            );
        } else {
            const clonedProduct = JSON.parse(JSON.stringify(product));
            newCart = [...state.cart, {
                ...clonedProduct,
                selectedColor: incomingColor,
                selectedSize: incomingSize,
                quantity: incomingQty,
                allowReturn: product.allowReturn !== false,
                allowReplacement: product.allowReplacement !== false
            }];
        }

        localStorage.setItem('cart', JSON.stringify(newCart));
        return { cart: newCart };
    }),

    removeFromCart: (productId, selectedSize, selectedColor) => set((state) => {
        console.log('removeFromCart called', productId, selectedSize, selectedColor);
        const filterColor = selectedColor || 'Default';
        const filterSize = selectedSize || 'One Size';
        const newCart = state.cart.filter(item =>
            !(getProductId(item) === productId &&
                (item.selectedSize || 'One Size') === filterSize &&
                (item.selectedColor || 'Default') === filterColor)
        );
        console.log('newCart after remove', newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        return { cart: newCart };
    }),

    updateQuantity: (productId, quantity, selectedSize, selectedColor, maxStock) => set((state) => {
        console.log('updateQuantity called', productId, quantity, selectedSize, selectedColor, maxStock);
        const filterColor = selectedColor || 'Default';
        const filterSize = selectedSize || 'One Size';

        // Validate against stock limit if provided
        if (maxStock && quantity > maxStock) {
            console.warn(`Cannot set quantity to ${quantity}. Stock limit is ${maxStock}`);
            return state; // Don't update if it exceeds stock
        }

        const newCart = state.cart.map(item =>
            (getProductId(item) === productId &&
                (item.selectedSize || 'One Size') === filterSize &&
                (item.selectedColor || 'Default') === filterColor)
                ? { ...item, quantity }
                : item
        ).filter(item => item.quantity > 0);
        console.log('newCart', newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        return { cart: newCart };
    }),

    clearCart: () => set(() => {
        localStorage.removeItem('cart');
        localStorage.removeItem('appliedCoupon');
        return { cart: [], appliedCoupon: null };
    }),

    applyCoupon: (coupon) => set(() => {
        localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
        return { appliedCoupon: coupon };
    }),

    removeCoupon: () => set(() => {
        localStorage.removeItem('appliedCoupon');
        return { appliedCoupon: null };
    }),

    getTotal: () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const subtotal = cart.reduce((sum, item) => {
            const priceValue = parseFloat(item.displayPrice ?? item.price ?? 0) || 0;
            return sum + priceValue * item.quantity;
        }, 0);
        return subtotal;
    },

    getDiscountedTotal: () => {
        const subtotal = get().getTotal();
        const coupon = get().appliedCoupon;
        if (coupon) {
            return Math.max(0, subtotal - coupon.discount);
        }
        return subtotal;
    }
}));