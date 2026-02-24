import AdminOnly from '../components/AdminOnly';
import DinnerForm from '../components/DinnerForm';

const NewDinnerPage = () => (
    <AdminOnly>
        <DinnerForm />
    </AdminOnly>
);

export default NewDinnerPage;
