import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ErrorBoundary from './context/ErrorBoundary';
import HomePage from './pages/HomePage';

function App() {
	return (
		<BrowserRouter>
			<ErrorBoundary>
				<Routes>
					<Route
						path='/'
						element={
							<Layout>
								<HomePage />
							</Layout>
						}
					/>
				</Routes>
			</ErrorBoundary>
		</BrowserRouter>
	);
}

export default App;
