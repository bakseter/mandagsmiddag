import AddDinnerForm from '../components/AddDinnerForm'
import AddRatingForm from '../components/AddRatingForm'
import DinnerCard from '../components/DinnerCard'
import { useGetDinnersQuery } from '../services/dinner'

const HomePage = () => {
    const { data: dinners = [], isLoading, error } = useGetDinnersQuery()

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error loading dinners</div>

    return (
        <div>
            <h1 className="text-3xl">MANDAGSMIDDAG</h1>

            <div className="my-4">
                {dinners.map((dinner, index) => (
                    <div key={index} className="mb-4">
                        <DinnerCard dinner={dinner} />
                    </div>
                ))}
            </div>

            <AddDinnerForm />
            <AddRatingForm />
        </div>
    )
}

export default HomePage
