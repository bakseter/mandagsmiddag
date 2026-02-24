import { type Dinner, useDeleteDinnerMutation } from '../services/dinner';
import {
    type User,
    useGetCurrentUserQuery,
    useGetUsersQuery,
} from '../services/user';
import AdminOnly from '../components/AdminOnly';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useMemo } from 'react';

interface Props {
    dinner: Dinner;
}

const getNameById = (users: User[], id: number): string | null =>
    users.find((user) => user.id === id);

const DinnerCard = ({ dinner }: Props) => {
    const { data: users, isLoading } = useGetUsersQuery();
    const [deleteDinner] = useDeleteDinnerMutation();
    const { data: currentUser } = useGetCurrentUserQuery();

    const date = new Date(dinner.date);

    const participants: User[] = useMemo(() => {
        if (!users) return [];

        return (
            dinner.participantIds
                ?.map((id) => getNameById(users, id))
                ?.filter((name) => name !== null) ?? []
        );
    }, [dinner.participantIds, users]);

    const host: User | null = useMemo(() => {
        if (!users || !dinner.hostUserId) return null;

        return getNameById(users, dinner.hostUserId);
    }, [dinner.hostUserId, users]);

    const onClick = async () => {
        try {
            await deleteDinner(dinner.id).unwrap();
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) return <p>Laster...</p>;

    return (
        <div className="p-4 border rounded shadow-md w-full max-w-md mt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">
                    {host ? `Arrangert av ${host.name}` : 'Ingen arrangør'}
                </h3>
                <span className="text-sm text-gray-500">
                    {format(date, 'dd MMMM yyyy', { locale: nb })}
                </span>
            </div>
            {dinner.food && (
                <div>
                    <strong>Matrett:</strong> {dinner.food}
                </div>
            )}

            {dinner.filmTitle && (
                <div>
                    <strong>Film:</strong>
                    {dinner.filmImdbUrl ? (
                        <a
                            href={dinner.filmImdbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline ml-1"
                        >
                            {dinner.filmTitle}
                        </a>
                    ) : (
                        <span> {dinner.filmTitle}</span>
                    )}
                </div>
            )}

            {participants.length > 0 && ( // eslint-disable-line no-magic-numbers
                <div>
                    <strong>Hvem møtte opp?</strong>{' '}
                    <p>
                        {participants
                            .map((participant) => participant.name)
                            .join(', ')}
                    </p>
                </div>
            )}

            <div className="mt-2 flex justify-start gap-2">
                {currentUser.id === dinner.hostUserId ||
                    (currentUser.isAdmin && (
                        <div className="mt-2">
                            <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors duration-200">
                                <a href={`/middag/${dinner.id}/rediger`}>
                                    Rediger middag
                                </a>
                            </button>
                        </div>
                    ))}

                <AdminOnly>
                    <div className="mt-2">
                        <button
                            onClick={onClick}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors duration-200"
                        >
                            Slett middag
                        </button>
                    </div>
                </AdminOnly>
            </div>
        </div>
    );
};

export default DinnerCard;
