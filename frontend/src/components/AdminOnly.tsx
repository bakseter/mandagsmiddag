import { type ReactNode } from 'react';
import { useGetCurrentUserQuery } from '../services/user';

interface AdminOnlyProps {
    children: ReactNode;
    message: string | null;
}

const AdminOnly = ({ children, message }: AdminOnlyProps) => {
    const { data: currentUser } = useGetCurrentUserQuery();

    if (!currentUser.isAdmin && !message) return null;
    if (!currentUser.isAdmin && message) return <p>{message}</p>;

    return <>{children}</>;
};

export default AdminOnly;
