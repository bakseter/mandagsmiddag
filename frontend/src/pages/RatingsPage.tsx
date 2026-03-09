import RatingCard from '../components/RatingCard';
import AddRatingForm from '../components/RatingForm';
import { useGetRatingsByUserQuery } from '../services/rating';
import { useGetCurrentUserQuery } from '../services/user';

const RatingsPage = () => {
    const { data: currentUser } = useGetCurrentUserQuery();
    const {
        data: ratings = [],
        isLoading,
        error,
    } = useGetRatingsByUserQuery(currentUser?.id || 0);

    if (isLoading) return <div>Laster Ratings...</div>;
    if (error) return <div>Klarte ikke hente Ratings</div>;

    return (
        <div>
            <h1 className="text-3xl">Alle Ratings</h1>
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
