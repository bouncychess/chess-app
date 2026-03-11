import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import News from './pages/News/News';
import Play from './pages/Play/Play';
import Game from './pages/Game/Game';
import Logout from './pages/Logout/Logout';
import Article from './pages/Article/Article';
import Profile from './pages/Profile/Profile';
import SignIn from './pages/SignIn/SignIn';
import Clive from './pages/Clive/Clive';
import Settings from './pages/Settings/Settings';
import Layout from './components/layout/Layout';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function GameWrapper() {
    const { gameId } = useParams<{ gameId: string }>();
    return <Game key={gameId} />;
}

export default function App() {
    return (
        <ThemeProvider>
        <AuthProvider>
            <WebSocketProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Navigate to="/play" replace />} />
                        <Route path="/play" element={<Layout><Play /></Layout>} />
                        <Route path="/game/:gameId" element={<Layout><GameWrapper /></Layout>} />
                        <Route path="/news" element={<Layout><News /></Layout>} />
                        <Route path="/user/:username" element={<Layout><Profile /></Layout>} />
                        <Route path="/signin" element={<Layout><SignIn /></Layout>} />
                        <Route path="/articles/:id" element={<Layout><Article /></Layout>} />
                        <Route path="/clive" element={<Layout><Clive /></Layout>} />
                        <Route path="/settings" element={<Layout><Settings /></Layout>} />
                        <Route path="/logout" element={<Layout><Logout /></Layout>} />
                    </Routes>
                </Router>
            </WebSocketProvider>
        </AuthProvider>
        </ThemeProvider>
    );
}
