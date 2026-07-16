import { useParams } from 'react-router-dom';

import { useGetDinnerByIdQuery } from '@/api/dinner';
import DinnerForm from '@/components/dinner-form';

const EditDinnerPage = () => {
    const { dinnerId } = useParams();

    const { data: dinner, error } = useGetDinnerByIdQuery(Number(dinnerId));

    if (!dinnerId) {
        return <p>Ingen middag valgt</p>;
    }

    if (!dinner) {
        return <p>Middag ikke funnet</p>;
    }

    if (error) {
        return <p>Feil ved innlastning av middag</p>;
    }

    return <DinnerForm dinner={dinner} />;
};

export default EditDinnerPage;
