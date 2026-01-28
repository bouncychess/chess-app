import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
<<<<<<< HEAD
import Home from './pages/Home/Home';
=======
>>>>>>> origin/main
import News from './pages/News/News';
import Play from './pages/Play/Play';
import Game from './pages/Game/Game';
import Logout from './pages/Logout/Logout';
import Article from './pages/Article/Article';
import Profile from './pages/Profile/Profile';
import SignIn from './pages/SignIn/SignIn';
import Layout from './components/layout/Layout';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Navigate to="/play" replace />} />
<<<<<<< HEAD
                        <Route path="/play" element={<ProtectedRoute><Layout><Play /></Layout></ProtectedRoute>} />
                        <Route path="/game/:gameId" element={<ProtectedRoute><Layout><Game /></Layout></ProtectedRoute>} />
                        <Route path="/home" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
                        <Route path="/news" element={<ProtectedRoute><Layout><News /></Layout></ProtectedRoute>} />
=======
                        <Route path="/play" element={<Layout><Play /></Layout>} />
                        <Route path="/game/:gameId" element={<Layout><Game /></Layout>} />
                        <Route path="/news" element={<Layout><News /></Layout>} />
                        <Route path="/profile" element={<Layout><Profile /></Layout>} />
                        <Route path="/signin" element={<Layout><SignIn /></Layout>} />
>>>>>>> origin/main
                        <Route path="/articles/:id" element={<Layout><Article /></Layout>} />
                        <Route path="/logout" element={<Logout />} />
                    </Routes>
                </Router>
            </WebSocketProvider>
        </AuthProvider>
    );
}
