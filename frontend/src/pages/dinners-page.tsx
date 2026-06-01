import { isPast } from 'date-fns';

import DinnerCard from '@/components/dinner-card';
import { useGetDinnersQuery } from '@/services/dinner';

const DinnersPage = () => {
    const { data: dinners = [], isLoading, error } = useGetDinnersQuery();

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

    if ([...upcomingDinners, ...pastDinners].length === 0) {
        return (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
                Ingen middager enda.
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                    Kommende middager
                </h2>
                <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
                    {upcomingDinners.map((dinner) => (
                        <DinnerCard key={dinner.id} dinner={dinner} />
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                    Tidligere middager
                </h2>
                <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
                    {pastDinners.map((dinner) => (
                        <DinnerCard key={dinner.id} dinner={dinner} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default DinnersPage;
