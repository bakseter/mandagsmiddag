import RatingCard from '../components/RatingCard';
import AddRatingForm from '../components/RatingForm';
import { useGetRatingsQuery } from '../services/rating';

const RatingsPage = () => {
    const { data: ratings = [], isLoading, error } = useGetRatingsQuery();

    if (isLoading) return <div>Laster vurderinger...</div>;
    if (error) return <div>Klarte ikke hente vurderinger</div>;

    return (
        <div>
            <h1 className="text-3xl">Alle vurderinger</h1>
            <AddRatingForm />
            <div className="my-4">
                {ratings.map((rating, index) => (
                    <div key={index} className="mb-4">
                        <RatingCard rating={rating} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RatingsPage;
