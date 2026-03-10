import { Controller, useForm } from 'react-hook-form';
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
    dinnerId: number;
}

const RatingForm = ({ dinnerId }: Props) => {
    const { data: currentUser } = useGetCurrentUserQuery();

    const [addRating, { isLoading, isSuccess, error }] = usePutRatingMutation();

    const { handleSubmit, control, reset } = useForm<FormValues>({
        defaultValues: {
            ratingId: 0,
            userId: currentUser?.id ?? 0,
            dinnerId: dinnerId,
            dinnerScore: 0,
            filmScore: 0,
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
            <h2 className="text-lg font-semibold mb-2">Legg til Rating</h2>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-2"
            >
                <Controller
                    name="dinnerId"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <input type="hidden" {...field} value={dinnerId} />
                    )}
                />

                <Controller
                    name="dinnerScore"
                    control={control}
                    rules={{ required: true, min: 1, max: 10 }}
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
                    rules={{ required: true, min: 1, max: 10 }}
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
                    {!isLoading && 'Legg til Rating'}
                </button>
                {isSuccess && (
                    <p className="text-green-600">Rating lagt til!</p>
                )}
                {error && (
                    <p className="text-red-600">
                        En feil oppstod oppstod imens ratingen ble lagt til :(
                    </p>
                )}
            </form>
        </div>
    );
};

export default RatingForm;
