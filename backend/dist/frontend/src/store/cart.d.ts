export interface CartItem {
    id: string;
    bookId: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
    stock: number;
}
interface CartState {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (item: Omit<CartItem, 'id'>) => void;
    updateQuantity: (bookId: string, quantity: number) => void;
    removeItem: (bookId: string) => void;
    clearCart: () => void;
    getItem: (bookId: string) => CartItem | undefined;
}
export declare const useCartStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<CartState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<CartState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: CartState) => void) => () => void;
        onFinishHydration: (fn: (state: CartState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<CartState, unknown>>;
    };
}>;
export {};
