import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useMemo } from 'react';
import AdminOnly from '../components/AdminOnly';
import { type Dinner, useDeleteDinnerMutation } from '../services/dinner';
import {
    type User,
    useGetCurrentUserQuery,
    useGetUsersQuery,
} from '../services/user';
import { useGetRatingsByUserQuery } from '../services/rating';

interface Props {
    dinner: Dinner;
}

const getNameById = (users: User[], id: number): User | undefined =>
    users.find((user) => user.id === id);

const DinnerCard = ({ dinner }: Props) => {
    const { data: users, isLoading } = useGetUsersQuery();
    const [deleteDinner] = useDeleteDinnerMutation();
    const { data: currentUser, isLoading: currentUserIsLoading } =
        useGetCurrentUserQuery();
    const { data: ratings, isLoading: ratingsAreLoading } =
        useGetRatingsByUserQuery();

    const date = new Date(dinner.date);

    const participants: (User | undefined)[] = useMemo(() => {
        if (!users) return [];

        return (
            dinner.participantIds
                ?.map((id) => getNameById(users, id))
                ?.filter((name) => name !== null) ?? []
        );
    }, [dinner.participantIds, users]);

    const ratingForDinner =
        ratings?.find((rating) => rating.dinnerId === dinner.id) ?? null;

    const host: User | null | undefined = useMemo(() => {
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
        <div className="mt-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {host ? `Arrangert av ${host.name}` : 'Ingen arrangør'}
                </h3>

                <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                    {format(date, 'dd MMMM yyyy', { locale: nb })}
                </span>
            </div>

            <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                {dinner.food && (
                    <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            Matrett:
                        </span>{' '}
                        {dinner.food}
                    </div>
                )}

                {dinner.filmTitle && (
                    <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            Film:
                        </span>{' '}
                        {dinner.filmImdbUrl ? (
                            <a
                                href={dinner.filmImdbUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 underline-offset-4 hover:underline dark:text-sky-400"
                            >
                                {dinner.filmTitle}
                            </a>
                        ) : (
                            <span>{dinner.filmTitle}</span>
                        )}
                    </div>
                )}

                {participants.length > 0 && (
                    <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            Hvem møtte opp?
                        </span>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                            {participants
                                .filter(
                                    (participant) => participant !== undefined
                                )
                                .map((participant) => participant.name)
                                .join(', ')}
                        </p>
                    </div>
                )}
            </div>

            {!ratingsAreLoading && ratingForDinner && (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Din rating
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-zinc-700 dark:text-zinc-300">
                        <span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                Middag:
                            </span>{' '}
                            {ratingForDinner.dinnerScore}/10
                        </span>
                        <span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                Film:
                            </span>{' '}
                            {ratingForDinner.filmScore}/10
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
                {!ratingsAreLoading &&
                    !currentUserIsLoading &&
                    !ratingForDinner &&
                    dinner.food &&
                    dinner.filmTitle &&
                    dinner.participantIds?.includes(currentUser?.id ?? 0) &&
                    currentUser.id !== dinner.hostUserId && (
                        <a
                            href={`/rating/${dinner.id}/rediger`}
                            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                            Legg til rating
                        </a>
                    )}

                {currentUser &&
                    (currentUser.id === dinner.hostUserId ||
                        currentUser.isAdmin) && (
                        <a
                            href={`/middag/${dinner.id}/rediger`}
                            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                        >
                            Rediger middag
                        </a>
                    )}

                <AdminOnly>
                    <button
                        onClick={onClick}
                        className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                        Slett middag
                    </button>
                </AdminOnly>
            </div>
        </div>
    );
};

export default DinnerCard;
