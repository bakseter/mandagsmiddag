import { isPast } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { useGetDinnersQuery } from '@/api/dinner';
import { useGetUsersQuery } from '@/api/user';
import DinnerCard from '@/components/dinner-card';

const DinnersPage = () => {
    const { data: dinners = [], isLoading, error } = useGetDinnersQuery();
    // TODO: only fetch the host's name by id instead of all users
    const { data: users = [] } = useGetUsersQuery({});
    const [showUpcomingDinners, setShowUpcomingDinners] = useState(false);
    const [showPastDinners, setShowPastDinners] = useState(false);

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                Henter middager...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                Klarte ikke hente middager :(
            </div>
        );
    }

    if (dinners.length === 0) {
        return (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
                Ingen middager enda.
            </div>
        );
    }

    // Newest first
    const sortedDinners = dinners.toSorted(
        (first, second) =>
            new Date(second.date).getTime() - new Date(first.date).getTime()
    );

    const upcomingDinners = sortedDinners.filter(
        (dinner) => !isPast(new Date(dinner.date))
    );
    const pastDinners = sortedDinners.filter((dinner) =>
        isPast(new Date(dinner.date))
    );

    const lastDinner = pastDinners.at(0);
    const nextDinner = upcomingDinners.at(-1);
    const nextDinnerHost = users.find(
        (user) => user.id === nextDinner?.hostUserId
    );

    const remainingUpcoming = upcomingDinners.filter(
        (dinner) => dinner.id !== nextDinner?.id
    );
    const remainingPast = pastDinners.filter(
        (dinner) => dinner.id !== lastDinner?.id
    );

    return (
        <div className="space-y-10">
            {/* Featured: most recent past + next upcoming.
                Reads left-to-right as a timeline: previous -> next. */}
            <section className="grid gap-5 md:grid-cols-2">
                {lastDinner && (
                    <div className="space-y-4">
                        <div className="px-2">
                            <h1 className="pb-1 text-2xl font-semibold tracking-tight text-zinc-900">
                                Forrige middag
                            </h1>
                            <p className="text-lg text-zinc-500">
                                Husk å legge til rating! 🫡
                            </p>
                        </div>

                        <DinnerCard dinner={lastDinner} />
                    </div>
                )}

                {nextDinner && (
                    <div className="space-y-4">
                        <div className="px-2">
                            <h1 className="pb-1 text-2xl font-semibold tracking-tight text-zinc-900">
                                Neste middag
                            </h1>
                            <p className="text-lg text-zinc-500">
                                Det går ned hos{' '}
                                <span className="font-bold italic">
                                    {nextDinnerHost?.name ?? 'noen'}
                                </span>{' '}
                                neste mandag 🔥
                            </p>
                        </div>

                        <DinnerCard dinner={nextDinner} />
                    </div>
                )}
            </section>

            {/* Archive: full width so expanding one list can't leave a tall
                column next to an empty one. Each opens into a responsive grid. */}
            {(remainingUpcoming.length > 0 || remainingPast.length > 0) && (
                <section className="space-y-4">
                    {remainingUpcoming.length > 0 && (
                        <div className="space-y-4">
                            <button
                                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                                onClick={() => {
                                    setShowUpcomingDinners(
                                        !showUpcomingDinners
                                    );
                                }}
                            >
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${
                                        showUpcomingDinners ? 'rotate-180' : ''
                                    }`}
                                />
                                Kommende middager ({remainingUpcoming.length})
                            </button>

                            {showUpcomingDinners && (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {remainingUpcoming.map((dinner) => (
                                        <DinnerCard
                                            key={dinner.id}
                                            dinner={dinner}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {remainingPast.length > 0 && (
                        <div className="space-y-4">
                            <button
                                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                                onClick={() => {
                                    setShowPastDinners(!showPastDinners);
                                }}
                            >
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${
                                        showPastDinners ? 'rotate-180' : ''
                                    }`}
                                />
                                Tidligere middager ({remainingPast.length})
                            </button>

                            {showPastDinners && (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {remainingPast.map((dinner) => (
                                        <DinnerCard
                                            key={dinner.id}
                                            dinner={dinner}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default DinnersPage;
