import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Plus, SquarePen } from 'lucide-react';
import { useMemo } from 'react';

import AdminOnly from '@/components/admin-only';
import { useGetDinnersQuery } from '@/services/dinner';
import { useGetRatingsQuery } from '@/services/rating';
import { useGetUsersQuery, type User } from '@/services/user';

const getUserById = (users: User[], id: number): User | null =>
    users.find((user) => user.id === id) ?? null;

const RatingsPage = () => {
    const { data: dinners = [], isLoading: dinnersLoading } =
        useGetDinnersQuery();
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
    const { data: ratings = [], isLoading: ratingsLoading } =
        useGetRatingsQuery();

    const sortedDinners = useMemo(
        () =>
            dinners.toSorted(
                (first, second) =>
                    new Date(second.date).getTime() -
                    new Date(first.date).getTime()
            ),
        [dinners]
    );

    if (dinnersLoading || usersLoading || ratingsLoading) {
        return (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Laster ratingsoversikt...
            </div>
        );
    }

    return (
        <AdminOnly>
            <div className="space-y-8">
                <section className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                        Ratings
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                        Se hvilke deltakere som allerede har rating på en
                        middag, og legg til manglende ratings under migrering.
                    </p>
                </section>

                {sortedDinners.length === 0 && (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-600 shadow-sm">
                        Ingen middager enda.
                    </div>
                )}

                {sortedDinners.length > 0 && (
                    <div className="space-y-6">
                        {sortedDinners.map((dinner) => {
                            const host = getUserById(users, dinner.hostUserId);

                            const participants =
                                dinner.participantIds
                                    ?.map((id) => getUserById(users, id))
                                    .filter((user) => user !== null) ?? [];

                            return (
                                <section
                                    key={dinner.id}
                                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                                >
                                    <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold text-zinc-900">
                                                    {host
                                                        ? `Arrangert av ${host.name}`
                                                        : 'Ingen arrangør'}
                                                </h2>
                                                <p className="mt-1 text-sm text-zinc-500">
                                                    {format(
                                                        new Date(dinner.date),
                                                        'dd MMMM yyyy',
                                                        { locale: nb }
                                                    )}
                                                </p>
                                            </div>

                                            <div className="grid gap-1 text-sm text-zinc-600 md:text-right">
                                                {dinner.food && (
                                                    <div>
                                                        <span className="text-zinc-500">
                                                            Mat:
                                                        </span>{' '}
                                                        <span className="font-medium text-zinc-900">
                                                            {dinner.food}
                                                        </span>
                                                    </div>
                                                )}

                                                {dinner.filmTitle && (
                                                    <div>
                                                        <span className="text-zinc-500">
                                                            Film:
                                                        </span>{' '}
                                                        {dinner.filmImdbUrl ? (
                                                            <a
                                                                href={
                                                                    dinner.filmImdbUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-medium text-sky-700 underline-offset-4 hover:underline"
                                                            >
                                                                {
                                                                    dinner.filmTitle
                                                                }
                                                            </a>
                                                        ) : (
                                                            <span className="font-medium text-zinc-900">
                                                                {
                                                                    dinner.filmTitle
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 py-4">
                                        {participants.length === 0 ? (
                                            <p className="text-sm text-zinc-500">
                                                Ingen deltakere registrert.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
                                                    <thead>
                                                        <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                                                            <th className="pb-2 font-medium">
                                                                Bruker
                                                            </th>
                                                            <th className="pb-2 font-medium">
                                                                Middag
                                                            </th>
                                                            <th className="pb-2 font-medium">
                                                                Film
                                                            </th>
                                                            <th className="pb-2 font-medium">
                                                                Status
                                                            </th>
                                                            <th className="pb-2 text-right font-medium">
                                                                Handling
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {participants.map(
                                                            (participant) => {
                                                                const rating =
                                                                    ratings.find(
                                                                        (
                                                                            entry
                                                                        ) =>
                                                                            entry.dinnerId ===
                                                                                dinner.id &&
                                                                            entry.userId ===
                                                                                participant.id
                                                                    );

                                                                return (
                                                                    <tr
                                                                        key={
                                                                            participant.id
                                                                        }
                                                                        className="rounded-xl bg-zinc-50 text-sm text-zinc-700"
                                                                    >
                                                                        <td className="rounded-l-xl px-4 py-3 font-medium text-zinc-900">
                                                                            {
                                                                                participant.name
                                                                            }
                                                                        </td>

                                                                        <td className="px-4 py-3">
                                                                            {rating
                                                                                ? `${String(rating.dinnerScore)}/10`
                                                                                : '—'}
                                                                        </td>

                                                                        <td className="px-4 py-3">
                                                                            {rating
                                                                                ? `${String(rating.filmScore)}/10`
                                                                                : '—'}
                                                                        </td>

                                                                        <td className="px-4 py-3">
                                                                            <span
                                                                                className={
                                                                                    rating
                                                                                        ? 'inline-flex rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700'
                                                                                        : 'inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800'
                                                                                }
                                                                            >
                                                                                {rating
                                                                                    ? 'Registrert'
                                                                                    : 'Mangler'}
                                                                            </span>
                                                                        </td>

                                                                        <td className="rounded-r-xl px-4 py-3">
                                                                            <div className="flex justify-end">
                                                                                {rating ? (
                                                                                    <a
                                                                                        href={`/middag/${String(
                                                                                            dinner.id
                                                                                        )}/rating/${String(
                                                                                            rating.id
                                                                                        )}/rediger`}
                                                                                        className="inline-flex items-center gap-2 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-300 hover:text-zinc-900"
                                                                                    >
                                                                                        <SquarePen
                                                                                            size={
                                                                                                16
                                                                                            }
                                                                                        />
                                                                                        Rediger
                                                                                    </a>
                                                                                ) : (
                                                                                    <a
                                                                                        href={`/middag/${String(
                                                                                            dinner.id
                                                                                        )}/rating/ny?userId=${String(
                                                                                            participant.id
                                                                                        )}`}
                                                                                        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                                                                                    >
                                                                                        <Plus
                                                                                            size={
                                                                                                16
                                                                                            }
                                                                                        />
                                                                                        Legg
                                                                                        til
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminOnly>
    );
};

export default RatingsPage;
