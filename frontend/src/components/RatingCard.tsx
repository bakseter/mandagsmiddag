import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useMemo } from 'react';
import { useGetDinnerByIdQuery } from '../services/dinner';
import { type Rating } from '../services/rating';
import { type User, useGetUsersQuery } from '../services/user';

interface Props {
    rating: Rating;
}

const getNameById = (users: User[], id: number): User | null => {
    return users.find((ur) => ur.id === id) ?? null;
};

const RatingCard = ({ rating }: Props) => {
    const { data: users, isLoading: usersLoading } = useGetUsersQuery();
    const { data: dinner, isLoading: dinnerLoading } = useGetDinnerByIdQuery(
        rating.dinnerId
    );
    const user: User | null = useMemo(() => {
        if (!users || !rating.userId) return null;
        return getNameById(users, rating.userId);
    }, [rating.userId, users]);

    const date = dinner?.date ? new Date(dinner.date) : null;

    if (usersLoading || dinnerLoading) return <p>Laster...</p>;

    return (
        <div className="p-4 border rounded shadow-md w-full max-w-md mt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">
                    {user ? user.name : 'Ukjent bruker'}
                </h3>
                {date && (
                    <span className="text-sm text-gray-500">
                        {format(date, 'dd MMMM yyyy', { locale: nb })}
                    </span>
                )}
            </div>

            {dinner?.food && (
                <div>
                    <strong>Matrett:</strong> {dinner.food}
                </div>
            )}

            <div>
                <strong>Middagsscore:</strong> {rating.dinnerScore}/10
            </div>

            {dinner?.filmTitle && (
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

            <div>
                <strong>Filmscore:</strong> {rating.filmScore}/10
            </div>
        </div>
    );
};

export default RatingCard;
