import { type ReactNode } from 'react';

import { useGetCurrentUserQuery } from '@/api/user';

interface Props {
    children: ReactNode;
    message?: string;
}

const AdminOnly = ({ children, message }: Props) => {
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
