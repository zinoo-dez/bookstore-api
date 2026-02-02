import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    if (requireAdmin && user?.role !== 'ADMIN') {
        return <Navigate to="/" replace/>;
    }
    return <>{children}</>;
};
export default ProtectedRoute;
//# sourceMappingURL=ProtectedRoute.js.map