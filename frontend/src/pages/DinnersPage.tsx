import DinnerCard from '../components/DinnerCard';
import { useGetDinnersQuery } from '../services/dinner';

const DinnersPage = () => {
    const { data: dinners = [], isLoading, error } = useGetDinnersQuery();

    if (isLoading) return <div>Henter middager...</div>;
    if (error) return <div>Klarte ikke hente middager :(</div>;

    return (
        <div>
            <h1 className="text-3xl">Alle middager</h1>

            <div className="my-4">
                {dinners.map((dinner, index) => (
                    <div key={index} className="mb-4">
                        <DinnerCard dinner={dinner} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DinnersPage;
