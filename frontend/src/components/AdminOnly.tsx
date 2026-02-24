import { type ReactNode } from 'react';
import { useGetCurrentUserQuery } from '../services/user';

interface Props {
    children: ReactNode;
    message: string | null;
}

const AdminOnly = ({ children, message }: Props) => {
    const { data: currentUser } = useGetCurrentUserQuery();

    if (!currentUser.isAdmin && !message) return null;
    if (!currentUser.isAdmin && message) return <p>{message}</p>;

    return <>{children}</>;
};

export default AdminOnly;
