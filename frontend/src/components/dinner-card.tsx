import { differenceInWeeks, format, isPast } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Pencil, SquarePen, Star, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import AdminOnly from '@/components/admin-only';
import { type Dinner, useDeleteDinnerMutation } from '@/services/dinner';
import { useGetRatingsByUserQuery } from '@/services/rating';
import {
    useGetCurrentUserQuery,
    useGetUsersQuery,
    type User,
} from '@/services/user';

interface Props {
    dinner: Dinner;
}

const getNameById = (users: User[], id: number): User | null =>
    users.find((user) => user.id === id) ?? null;

// eslint-disable-next-line max-statements
const DinnerCard = ({ dinner }: Props) => {
    const { data: users, isLoading } = useGetUsersQuery();
    const { data: currentUser, isLoading: currentUserIsLoading } =
        useGetCurrentUserQuery();
    const { data: ratings, isLoading: ratingsAreLoading } =
        useGetRatingsByUserQuery();

    const [deleteDinner] = useDeleteDinnerMutation();

    const participants = useMemo(() => {
        if (!users) {
            return [];
        }

        return dinner.participantIds?.map((id) => getNameById(users, id)) ?? [];
    }, [dinner.participantIds, users]);

    const host: User | null = useMemo(() => {
        if (!users || !dinner.hostUserId) {
            return null;
        }

        return getNameById(users, dinner.hostUserId);
    }, [dinner.hostUserId, users]);

    if (isLoading) {
        return <></>;
    }

    const handleDelete = async () => {
        // eslint-disable-next-line no-alert
        const confirmed = globalThis.confirm(
            'Er du sikker på at du vil slette denne middagen?'
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteDinner(dinner.id).unwrap();
        } catch (error) {
            console.error(error);
        }
    };

    const date = new Date(dinner.date);

    const ratingForDinner =
        ratings?.find((rating) => rating.dinnerId === dinner.id) ?? null;

    const canAddRating =
        !ratingsAreLoading &&
        !currentUserIsLoading &&
        !ratingForDinner &&
        Boolean(dinner.food) &&
        Boolean(dinner.filmTitle) &&
        dinner.participantIds?.includes(currentUser?.id ?? 0) &&
        currentUser?.id !== dinner.hostUserId;

    const canEditDinner =
        currentUser &&
        (currentUser.id === dinner.hostUserId || currentUser.isAdmin);

    return (
        <article className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-zinc-900">
                        {host ? `Arrangert av ${host.name}` : 'Ingen arrangør'}
                    </h3>

                    <span className="mt-1 block text-sm text-zinc-500">
                        {format(date, 'dd MMMM yyyy', { locale: nb })}
                    </span>
                </div>

                {/* Card actions */}
                <div className="flex shrink-0 items-center gap-1">
                    {canEditDinner && (
                        <a
                            href={`/middag/${String(dinner.id)}/rediger`}
                            title="Rediger middag"
                            aria-label="Rediger middag"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900"
                        >
                            <Pencil size={18} />
                        </a>
                    )}

                    <AdminOnly>
                        {/* eslint-disable @typescript-eslint/no-misused-promises */}
                        <button
                            onClick={handleDelete}
                            title="Slett middag"
                            aria-label="Slett middag"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                            <Trash2 size={18} />
                        </button>
                        {/* eslint-enable */}
                    </AdminOnly>
                </div>
            </div>

            {/* Dinner info */}
            <div className="space-y-3 text-sm text-zinc-700">
                {dinner.food && (
                    <div>
                        <span className="font-medium text-zinc-900">
                            Matrett:
                        </span>{' '}
                        {dinner.food}
                    </div>
                )}

                {dinner.filmTitle && (
                    <div>
                        <span className="font-medium text-zinc-900">Film:</span>{' '}
                        {dinner.filmImdbUrl ? (
                            <a
                                href={dinner.filmImdbUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 underline-offset-4 hover:underline"
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
                        <span className="font-medium text-zinc-900">
                            Hvem møtte opp?
                        </span>
                        <p className="mt-1 text-zinc-600">
                            {participants
                                .filter(
                                    (participant): participant is User =>
                                        participant !== null
                                )
                                .map((participant) => participant.name)
                                .join(', ')}
                        </p>
                    </div>
                )}
            </div>

            {/* Rating card */}
            {!ratingsAreLoading && ratingForDinner && (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm">
                    <div className="mb-2 uppercase text-zinc-500">
                        Din rating
                    </div>
                    <div className=" flex items-center justify-between">
                        <span className="text-sm">
                            <span className="font-bold text-zinc-900">
                                Middag:
                            </span>{' '}
                            {ratingForDinner.dinnerScore}/10
                        </span>

                        <span className="text-sm">
                            <span className="font-bold text-zinc-900">
                                Film:
                            </span>{' '}
                            {ratingForDinner.filmScore}/10
                        </span>

                        <div className="flex items-center gap-1">
                            {differenceInWeeks(new Date(), date) <= 1 &&
                                isPast(date) && (
                                    <a
                                        href={`/middag/${String(
                                            dinner.id
                                        )}/rating/${String(
                                            ratingForDinner.id
                                        )}/rediger`}
                                        title="Rediger rating"
                                        aria-label="Rediger rating"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900"
                                    >
                                        <SquarePen size={16} />
                                    </a>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add rating */}
            {canAddRating &&
                differenceInWeeks(new Date(), date) <= 1 &&
                isPast(date) && (
                    <div className="mt-4">
                        <a
                            href={`/middag/${String(dinner.id)}/rating/ny`}
                            title="Legg til rating"
                            aria-label="Legg til rating"
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                        >
                            <Star size={18} className="text-zinc-400" />
                            Legg til rating
                        </a>
                    </div>
                )}

            {canAddRating &&
                !(differenceInWeeks(new Date(), date) <= 1 && isPast(date)) && (
                    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
                        Du rakk ikke å legge inn en rating i tide
                    </div>
                )}
        </article>
    );
};

export default DinnerCard;
