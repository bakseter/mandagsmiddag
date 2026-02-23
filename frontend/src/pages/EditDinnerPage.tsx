import DinnerForm from '../components/DinnerForm';
import { useGetDinnerByIdQuery } from '../services/dinner';
import { useParams } from 'react-router-dom';

const EditDinnerPage = () => {
    const { dinnerId } = useParams();

    const {
        data: dinner,
        isLoading,
        error,
    } = useGetDinnerByIdQuery(Number(dinnerId));

    if (!dinnerId) return <p>Ingen middag valgt</p>;
    if (!dinner) return <p>Middag ikke funnet</p>;
    if (isLoading) return <p>Laster middag...</p>;
    if (error) return <p>Feil ved innlastning av middag</p>;

    return <DinnerForm dinner={dinner} />;
};

export default EditDinnerPage;
