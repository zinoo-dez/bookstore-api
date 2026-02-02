import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export const useCartStore = create()(persist((set, get) => ({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.bookId === item.bookId);
        let newItems;
        if (existingItem) {
            newItems = state.items.map((i) => i.bookId === item.bookId
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, item.stock) }
                : i);
        }
        else {
            newItems = [
                ...state.items,
                {
                    ...item,
                    id: `cart-${Date.now()}-${Math.random()}`,
                    quantity: Math.min(item.quantity, item.stock),
                },
            ];
        }
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return {
            items: newItems,
            totalItems,
            totalPrice,
        };
    }),
    updateQuantity: (bookId, quantity) => set((state) => {
        const newItems = state.items
            .map((item) => item.bookId === bookId
            ? { ...item, quantity: Math.min(Math.max(0, quantity), item.stock) }
            : item)
            .filter((item) => item.quantity > 0);
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return {
            items: newItems,
            totalItems,
            totalPrice,
        };
    }),
    removeItem: (bookId) => set((state) => {
        const newItems = state.items.filter((item) => item.bookId !== bookId);
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return {
            items: newItems,
            totalItems,
            totalPrice,
        };
    }),
    clearCart: () => set({
        items: [],
        totalItems: 0,
        totalPrice: 0,
    }),
    getItem: (bookId) => get().items.find((item) => item.bookId === bookId),
}), {
    name: 'cart-storage',
    storage: createJSONStorage(() => localStorage),
}));
//# sourceMappingURL=cart.js.map