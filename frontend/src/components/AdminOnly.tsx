import { type ReactNode } from 'react';
import { useGetCurrentUserQuery } from '../services/user';

interface AdminOnlyProps {
    children: ReactNode;
}

const AdminOnly = ({ children }: AdminOnlyProps) => {
    const { data: currentUser } = useGetCurrentUserQuery();

    if (!currentUser.isAdmin) {
        return <p>Du hakke tilgang till denna sida.</p>;
    }

    return <>{children}</>;
};

export default AdminOnly;
