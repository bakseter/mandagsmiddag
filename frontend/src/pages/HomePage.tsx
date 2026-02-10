import { useGetDinnersQuery } from "../services/dinner";
import AddDinnerForm from "../components/AddDinnerForm";
import AddRatingForm from "../components/AddRatingForm";

const HomePage = () => {
  const { data: dinners = [], isLoading, error } = useGetDinnersQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading dinners</div>;

  return (
    <div>
      <h1>MANDAGSMIDDAG</h1>

      {dinners.map((dinner, index) => (
        <div key={index}>{JSON.stringify(dinner)}</div>
      ))}

      <AddDinnerForm />
      <AddRatingForm />
    </div>
  );
};

export default HomePage;
