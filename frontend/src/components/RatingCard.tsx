import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useMemo } from 'react';
import AdminOnly from '../components/AdminOnly';
import { useGetDinnerByIdQuery } from '../services/dinner';
import { type Rating, useDeleteRatingMutation } from '../services/rating';
import {
    type User,
    useGetCurrentUserQuery,
    useGetUsersQuery,
} from '../services/user';

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
    const { data: currentUser } = useGetCurrentUserQuery();
    const [deleteRating] = useDeleteRatingMutation();

    const user: User | null = useMemo(() => {
        if (!users || !rating.userId) return null;
        return getNameById(users, rating.userId);
    }, [rating.userId, users]);

    const date = dinner?.date ? new Date(dinner.date) : null;

    const onClick = async () => {
        try {
            await deleteRating(rating.id).unwrap();
        } catch (err) {
            console.error(err);
        }
    };

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

            <div className="mt-2 flex justify-start gap-2">
                {(currentUser?.id === rating.userId ||
                    currentUser?.isAdmin) && (
                    <div className="mt-2">
                        <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors duration-200">
                            <a href={`/vurdering/${rating.id}/rediger`}>
                                Rediger vurdering
                            </a>
                        </button>
                    </div>
                )}

                <AdminOnly message={null}>
                    <div className="mt-2">
                        <button
                            onClick={onClick}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors duration-200"
                        >
                            Slett rating
                        </button>
                    </div>
                </AdminOnly>
            </div>
        </div>
    );
};

export default RatingCard;
