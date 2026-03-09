import { Controller, useForm } from 'react-hook-form';
import { useGetDinnersQuery } from '../services/dinner';
import { type Rating, usePutRatingMutation } from '../services/rating';
import { useGetCurrentUserQuery } from '../services/user';

interface FormValues {
    ratingId: number;
    userId: number;
    dinnerId: number;
    dinnerScore: number;
    filmScore: number;
}

interface Props {
    rating?: Rating | null;
}

const AddRatingForm = ({ rating = null }: Props) => {
    const { data: currentUser } = useGetCurrentUserQuery();
    const [addRating, { isLoading, isSuccess, error }] = usePutRatingMutation();

    const { data: dinners = [] } = useGetDinnersQuery();

    const isEditMode = Boolean(rating);

    const { handleSubmit, control, reset } = useForm<FormValues>({
        defaultValues: {
            ratingId: rating?.id ?? 0,
            userId: currentUser?.id ?? 0,
            dinnerId: rating?.dinnerId ?? 0,
            dinnerScore: rating?.dinnerScore ?? 0,
            filmScore: rating?.filmScore ?? 0,
        },
    });

    const onSubmit = async (data: FormValues) => {
        try {
            const formRating: Rating = {
                id: data.ratingId,
                userId: Number(data.userId),
                dinnerId: Number(data.dinnerId),
                dinnerScore: Number(data.dinnerScore),
                filmScore: Number(data.filmScore),
            };

            await addRating(formRating).unwrap();
            reset();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-4 border rounded shadow-md w-full max-w-md mt-4">
            <h2 className="text-lg font-semibold mb-2">
                {isEditMode ? 'Rediger Rating' : 'Legg til Rating'}
            </h2>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-2"
            >
                <Controller
                    name="dinnerId"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <select {...field} className="border p-2 rounded">
                            <option value="">Velg Middag</option>
                            {dinners.map((dinner) => (
                                <option key={dinner.id} value={dinner.id}>
                                    {new Date(dinner.date).toLocaleString()} —{' '}
                                    {dinner?.food}
                                </option>
                            ))}
                        </select>
                    )}
                />
                <Controller
                    name="dinnerScore"
                    control={control}
                    rules={{ required: true, min: 0, max: 10 }}
                    render={({ field }) => (
                        <input
                            type="number"
                            {...field}
                            placeholder="Middag Score (0-10)"
                            className="border p-2 rounded"
                            min={0}
                            max={10}
                        />
                    )}
                />
                <Controller
                    name="filmScore"
                    control={control}
                    rules={{ required: true, min: 0, max: 10 }}
                    render={({ field }) => (
                        <input
                            type="number"
                            {...field}
                            placeholder="Middag Score (0-10)"
                            className="border p-2 rounded"
                            min={0}
                            max={10}
                        />
                    )}
                />
                <button
                    type="submit"
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                    disabled={isLoading}
                >
                    {isLoading && 'Lagrer...'}
                    {!isLoading &&
                        (isEditMode ? 'Oppdater Rating' : 'Legg til Rating')}
                </button>
                {isSuccess && (
                    <p className="text-green-600">
                        Rating {isEditMode ? 'oppdatert' : 'lagt til'}!
                    </p>
                )}
                {error && (
                    <p className="text-red-600">
                        En feil oppstod oppstod imens ratingen ble{' '}
                        {isEditMode ? 'oppdatert' : 'lagt til'}!
                    </p>
                )}
            </form>
        </div>
    );
};

export default AddRatingForm;
