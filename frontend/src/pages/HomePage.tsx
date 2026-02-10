import { useGetDinnersQuery } from '../services/dinner'
import AddDinnerForm from '../components/AddDinnerForm'
import AddRatingForm from '../components/AddRatingForm'
import DinnerCard from '../components/DinnerCard'

const HomePage = () => {
    const { data: dinners = [], isLoading, error } = useGetDinnersQuery()

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error loading dinners</div>

    return (
        <div>
            <h1 className="text-3xl">MANDAGSMIDDAG</h1>

            {dinners.map((dinner, index) => (
                <DinnerCard key={index} dinner={dinner} />
            ))}

            <AddDinnerForm />
            <AddRatingForm />
        </div>
    )
}

export default HomePage
