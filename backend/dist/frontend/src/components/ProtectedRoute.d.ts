interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}
declare const ProtectedRoute: ({ children, requireAdmin }: ProtectedRouteProps) => import("react").JSX.Element;
export default ProtectedRoute;
