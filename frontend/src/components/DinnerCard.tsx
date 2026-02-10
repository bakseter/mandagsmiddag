import { format } from 'date-fns'

type Dinner = {
    id: number
    hostUserID: number
    host?: string // Assuming we have the host's name available
    date: string // ISO string format
    food?: string
    filmID?: number
    participants: string[] // List of participant names
}

type DinnerCardProps = {
    dinner: Dinner
}

const DinnerCard = ({ dinner }: DinnerCardProps) => {
    const date = new Date(dinner.date)

    return (
        <div className="bg-white rounded-xl shadow-md p-4 w-full max-w-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                    {dinner.host ? `Hosted by ${dinner.host}` : 'Dinner'}
                </h3>
                <span className="text-sm text-gray-500">
                    {format(date, 'PPP p')}
                </span>
            </div>
            <div className="mb-2">
                <strong>Participants:</strong>{' '}
                {dinner?.participants?.join(', ') ?? 'None'}
            </div>
            {dinner.food && (
                <div className="text-gray-700">
                    <strong>Food:</strong> {dinner.food}
                </div>
            )}
        </div>
    )
}

export default DinnerCard
