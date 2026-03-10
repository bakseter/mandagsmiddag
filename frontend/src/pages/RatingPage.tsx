import RatingForm from '../components/RatingForm';
import { useParams } from 'react-router-dom';

const RatingPage = () => {
    const { dinnerId } = useParams();

    if (!dinnerId) return <p>Ingen middag valgt</p>;

    return (
        <div>
            <RatingForm dinnerId={Number(dinnerId)} />
        </div>
    );
};

export default RatingPage;
