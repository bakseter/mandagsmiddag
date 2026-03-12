import AdminOnly from '@/components/admin-only';
import DinnerForm from '@/components/dinner-form';

const NewDinnerPage = () => (
    <AdminOnly>
        <DinnerForm />
    </AdminOnly>
);

export default NewDinnerPage;
