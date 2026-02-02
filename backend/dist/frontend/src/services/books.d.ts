import { CreateBookData, SearchBooksData } from '@/lib/schemas';
export declare const useBooks: (params?: SearchBooksData) => import("@tanstack/react-query").UseQueryResult<BooksResponse, Error>;
export declare const useBook: (id: string) => import("@tanstack/react-query").UseQueryResult<Book, Error>;
export declare const useCreateBook: () => import("@tanstack/react-query").UseMutationResult<Book, Error, CreateBookData, unknown>;
export declare const useUpdateBook: () => import("@tanstack/react-query").UseMutationResult<Book, Error, {
    id: string;
    data: Partial<CreateBookData>;
}, unknown>;
export declare const useDeleteBook: () => import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
export declare const useOutOfStockBooks: () => import("@tanstack/react-query").UseQueryResult<Book[], Error>;
export declare const useLowStockBooks: () => import("@tanstack/react-query").UseQueryResult<Book[], Error>;
