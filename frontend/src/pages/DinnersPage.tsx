import DinnerCard from '../components/DinnerCard';
import { useGetDinnersQuery } from '../services/dinner';

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

    const sortedDinners = [...dinners].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="space-y-8">
            <section className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                    Alle middager
                </h1>
            </section>

            {sortedDinners.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-600 shadow-sm">
                    Ingen middager enda.
                </div>
            ) : (
                <section className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
                    {sortedDinners.map((dinner) => (
                        <DinnerCard key={dinner.id} dinner={dinner} />
                    ))}
                </section>
            )}
        </div>
    );
};

export default DinnersPage;
