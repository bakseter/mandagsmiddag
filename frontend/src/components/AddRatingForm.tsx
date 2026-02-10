import { Controller, useForm } from 'react-hook-form'
import { useGetDinnersQuery } from '../services/dinner'
import { usePostRatingMutation } from '../services/rating'

interface FormValues {
    dinnerId: string
    dinnerScore: number
    filmScore: number
}

const AddRatingForm = () => {
    const { handleSubmit, control, reset } = useForm<FormValues>(),
        { data: dinners = [] } = useGetDinnersQuery(),
        [addRating, { isLoading, isSuccess, error }] = usePostRatingMutation(),
        onSubmit = async (data: FormValues) => {
            await addRating({
                dinnerId: data.dinnerId,
                dinnerScore: Number(data.dinnerScore),
                filmScore: Number(data.filmScore),
            })
            reset()
        }

    return (
        <div className="p-4 border rounded shadow-md w-full max-w-md mt-4">
            <h2 className="text-lg font-semibold mb-2">Add Rating</h2>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-2"
            >
                <Controller
                    name="dinnerId"
                    control={control}
                    rules={{ required: true }}
                    defaultValue=""
                    render={({ field }) => (
                        <select {...field} className="border p-2 rounded">
                            <option value="">Select Dinner</option>
                            {dinners.map((dinner) => (
                                <option key={dinner.id} value={dinner.id}>
                                    {new Date(dinner.date).toLocaleString()} —{' '}
                                    {dinner?.participants?.join(', ') ??
                                        'No participants'}
                                </option>
                            ))}
                        </select>
                    )}
                />
                <Controller
                    name="dinnerScore"
                    control={control}
                    defaultValue={0}
                    rules={{ required: true, min: 0, max: 10 }}
                    render={({ field }) => (
                        <input
                            type="number"
                            {...field}
                            placeholder="Dinner Score (0-10)"
                            className="border p-2 rounded"
                            min={0}
                            max={10}
                        />
                    )}
                />
                <Controller
                    name="filmScore"
                    control={control}
                    defaultValue={0}
                    rules={{ required: true, min: 0, max: 10 }}
                    render={({ field }) => (
                        <input
                            type="number"
                            {...field}
                            placeholder="Film Score (0-10)"
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
                    Add Rating
                </button>
                {isSuccess && <p className="text-green-600">Rating added!</p>}
                {error && <p className="text-red-600">Error adding rating</p>}
            </form>
        </div>
    )
}

export default AddRatingForm
