import { type ReactNode } from 'react';

import { useGetCurrentUserQuery } from '@/services/user';

interface Properties {
    children: ReactNode;
    message?: string;
}

const AdminOnly = ({ children, message }: Properties) => {
    const { data: currentUser } = useGetCurrentUserQuery();

    if (!currentUser?.isAdmin && !message) {
        return null;
    }
    if (!currentUser?.isAdmin && message) {
        return <p>{message}</p>;
    }

    return <>{children}</>;
};

export default AdminOnly;
