import { type Dinner, useDeleteDinnerMutation } from '../services/dinner'
import { format } from 'date-fns'

interface DinnerCardProps {
    dinner: Dinner
}

const DinnerCard = ({ dinner }: DinnerCardProps) => {
    const date = new Date(dinner.date),
        [deleteDinner] = useDeleteDinnerMutation(),
        onClick = async () => {
            try {
                await deleteDinner(dinner.id).unwrap()
            } catch (err) {
                console.error(err)
            }
        }

    return (
        <div className="bg-white rounded-xl shadow-md p-4 w-full max-w-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                    {dinner.host_user_id
                        ? `Hosted by user_id ${dinner.host_user_id}`
                        : 'Dinner'}
                </h3>
                <span className="text-sm text-gray-500">
                    {format(date, 'PPP p')}
                </span>
            </div>
            <div className="mb-2">
                <strong>Participants:</strong>{' '}
                {dinner?.participant_ids?.join(', ') ?? 'None'}
            </div>

            {dinner.food && (
                <div className="text-gray-700">
                    <strong>Food:</strong> {dinner.food}
                </div>
            )}

            {dinner.film_title && (
                <div className="text-gray-700">
                    <strong>Film:</strong> {dinner.film_title}
                </div>
            )}

            <div className="mt-4">
                <button
                    onClick={onClick}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors duration-200"
                >
                    Delete
                </button>
            </div>
        </div>
    )
}

export default DinnerCard
