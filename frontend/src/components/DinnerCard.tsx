import { type Dinner, useDeleteDinnerMutation } from '../services/dinner';
import { type User, useGetUsersQuery } from '../services/user';
import AdminOnly from '../components/AdminOnly';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useMemo } from 'react';

interface DinnerCardProps {
    dinner: Dinner;
}

const getNameById = (users: User[], id: number): string | null =>
    users.find((user) => user.id === id);

const DinnerCard = ({ dinner }: DinnerCardProps) => {
    const { data: users, isLoading } = useGetUsersQuery();
    const [deleteDinner] = useDeleteDinnerMutation();

    const date = new Date(dinner.date);

    const participants: User[] = useMemo(() => {
        if (!users) return [];

        return dinner.participantIds
            ?.map((id) => getNameById(users, id))
            ?.filter((name) => name !== null);
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
            <div className="mb-2">
                <strong>Hvem møtte opp?</strong>{' '}
                {participants.length > 0 // eslint-disable-line no-magic-numbers
                    ? participants
                          .map((participant) => participant.name)
                          .join(', ')
                    : 'Ingen deltakere'}
            </div>

            {dinner.food && (
                <div className="text-gray-700">
                    <strong>Matrett:</strong> {dinner.food}
                </div>
            )}

            {dinner.filmTitle && (
                <div className="text-gray-700">
                    <strong>Film:</strong> {dinner.filmTitle}
                </div>
            )}

            <AdminOnly>
                <div className="mt-4">
                    <button
                        onClick={onClick}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors duration-200"
                    >
                        Slett middag
                    </button>
                </div>
            </AdminOnly>
        </div>
    );
};

export default DinnerCard;
