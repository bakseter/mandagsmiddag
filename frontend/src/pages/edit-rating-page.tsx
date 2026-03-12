import { useParams, useSearchParams } from 'react-router-dom';

import RatingForm from '@/components/rating-form';
import { useGetRatingByIdQuery } from '@/services/rating';
import { numberToString } from '@/utils/misc';

// eslint-disable-next-line max-statements
const EditRatingPage = () => {
    const { dinnerId, ratingId } = useParams();
    const [searchParams] = useSearchParams();

    const { data: rating } = useGetRatingByIdQuery(Number(ratingId));

    const userId = numberToString(searchParams.get('userId'));

    if (!dinnerId) {
        return <p>Ingen middag valgt</p>;
    }

    if (!rating) {
        return <p>Rating ikke funnet</p>;
    }

    if (!ratingId) {
        return <p>Ingen rating valgt</p>;
    }

    return (
        <RatingForm
            dinnerId={Number(dinnerId)}
            rating={rating}
            userId={userId}
        />
    );
};

export default EditRatingPage;
