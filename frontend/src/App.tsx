import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { usePutUserMutation } from './services/user'
import './App.css'
import Layout from './components/Layout'
import ErrorBoundary from './context/ErrorBoundary'
import HomePage from './pages/HomePage'

const App = () => {
    const [putUser] = usePutUserMutation()

    // On app load, ensure the user is registered in the backend
    useEffect(() => {
        putUser()
    }, [putUser])

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <Layout>
                                <HomePage />
                            </Layout>
                        }
                    />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    )
}

export default App
