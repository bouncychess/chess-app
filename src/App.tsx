import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Play from './pages/Play/Play';
import Game from './pages/Game/Game';
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
                        <Route path="/game/:gameId" element={<Layout><Game /></Layout>} />
                        <Route path="/home" element={<Layout><Home /></Layout>} />
                        <Route path="/articles/:id" element={<Layout><Article /></Layout>} />
                        <Route path="/logout" element={<Logout />} />
                    </Routes>
                </Router>
            </WebSocketProvider>
        </AuthProvider>
    );
}