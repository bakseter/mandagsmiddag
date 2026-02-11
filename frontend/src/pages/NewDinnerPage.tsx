import AddDinnerForm from '../components/AddDinnerForm';
import AdminOnly from '../components/AdminOnly';

const NewDinnerPage = () => (
    <AdminOnly>
        <AddDinnerForm />
    </AdminOnly>
);

export default NewDinnerPage;
