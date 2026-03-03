import RatingCard from '../components/RatingCard';
import { useGetRatingsQuery } from '../services/rating';

const RatingsPage = () => {
    const { data: ratings = [], isLoading, error } = useGetRatingsQuery();

    if (isLoading) return <div>Laster vurderinger...</div>;
    if (error) return <div>Klarte ikke hente vurderinger</div>;

    return (
        <div>
            <h1 className="text-3xl">Alle vurderinger</h1>

            <div className="my-4">
                {ratings.map((rating, index) => (
                    <div key={index} className="mb-4">
                        <RatingCard
                            userId={rating.userId}
                            dinnerId={rating.dinnerId}
                            dinnerScore={rating.dinnerScore}
                            filmScore={rating.filmScore}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RatingsPage;
