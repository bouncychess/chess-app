import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Play from './pages/Play/Play';
import Logout from './pages/Logout/Logout';
import Article from './pages/Article/Article';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Navigate to="/play" replace />} />
                        <Route path="/play" element={<ProtectedRoute><Layout><Play /></Layout></ProtectedRoute>} />
                        <Route path="/home" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
                        <Route path="/articles/:id" element={<Layout><Article /></Layout>} />
                    <Route path="/logout" element={<Logout />} />
                    </Routes>
                </Router>
            </WebSocketProvider>
        </AuthProvider>
    );
}