import { useParams } from 'react-router-dom';

import RatingForm from '@/components/rating-form';
import { useGetRatingByIdQuery } from '@/services/rating';

const EditRatingPage = () => {
    const { dinnerId, ratingId } = useParams();
    const { data: rating } = useGetRatingByIdQuery(Number(ratingId));

    if (!dinnerId) {
        return <p>Ingen middag valgt</p>;
    }

    if (!rating) {
        return <p>Rating ikke funnet</p>;
    }

    if (!ratingId) {
        return <p>Ingen rating valgt</p>;
    }

    return <RatingForm dinnerId={Number(dinnerId)} rating={rating} />;
};

export default EditRatingPage;
