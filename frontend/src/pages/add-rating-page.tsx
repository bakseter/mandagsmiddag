import { useParams, useSearchParams } from 'react-router-dom';

import RatingForm from '@/components/rating-form';

const numberToString = (num: string | null): number | null => {
    if (!num) {
        return null;
    }

    const parsed = Number(num);

    return isNaN(parsed) ? null : parsed;
};

const AddRatingPage = () => {
    const { dinnerId } = useParams();
    const [searchParams] = useSearchParams();

    const userId = numberToString(searchParams.get('userId'));

    if (!dinnerId) {
        return <p>Ingen middag valgt</p>;
    }

    return <RatingForm dinnerId={Number(dinnerId)} userId={userId} />;
};

export default AddRatingPage;
