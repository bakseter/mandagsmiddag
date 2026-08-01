import AdminOnly from '@/components/admin-only';
import PenaltyForm from '@/components/penalty-form';

const NewPenaltyPage = () => (
    <AdminOnly>
        <PenaltyForm />
    </AdminOnly>
);

export default NewPenaltyPage;
