import React from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
	const { user, loading } = useAuth();

	if (loading) return <div>Carregando...</div>;
	if (!user) return <Navigate to="/login" />;

	return <>{children}</>;
};

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route
						path="/"
						element={
							<PrivateRoute>
								<AdminLayout />
							</PrivateRoute>
						}
					>
						<Route index element={<Dashboard />} />
						<Route path="*" element={<Navigate to="/" />} />
					</Route>
				</Routes>
			</Router>
		</AuthProvider>
	);
}

export default App;
