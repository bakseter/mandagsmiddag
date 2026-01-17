import { useEffect, useState } from 'react';

interface Dinner {
	[key: string]: unknown;
}

function HomePage() {
	const [dinners, setDinners] = useState<Dinner[]>([]);

	async function getDinners() {
		const res = await fetch(`http://localhost:8080/api/dinners`);
		const data = await res.json();
		console.log(data);
		return data;
	}

	useEffect(() => {
		getDinners().then((result) => {
			setDinners(result);
		});
	}, []);
	return (
		<div>
			{dinners.map((dinner, index) => (
				<div key={index}>{JSON.stringify(dinner)}</div>
			))}
		</div>
	);
}

export default HomePage;
