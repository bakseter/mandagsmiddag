import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ErrorBoundary from './context/ErrorBoundary';
import { KeycloakProvider } from './context/KeycloakContext';
import HomePage from './pages/HomePage';

function App() {
	return (
		<KeycloakProvider>
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
		</KeycloakProvider>
	);
}

export default App;
