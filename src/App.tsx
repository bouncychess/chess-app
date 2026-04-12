import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import News from './pages/News/News';
import Play from './pages/Play/Play';
import Game from './pages/Game/Game';
import Logout from './pages/Logout/Logout';
import Article from './pages/Article/Article';
import ArticleEditor from './pages/ArticleEditor/ArticleEditor';
import Profile from './pages/Profile/Profile';
import SignIn from './pages/SignIn/SignIn';
import Clive from './pages/Clive/Clive';
import Diet from './pages/Diet/Diet';
import Settings from './pages/Settings/Settings';
import Layout from './components/layout/Layout';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { SoundManager } from './utils/SoundManager';

// Preload all game sounds immediately
SoundManager.preloadAll();

// Unlock audio on first user interaction (required by mobile browsers)
const unlockAudio = () => {
    SoundManager.unlock();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
};
document.addEventListener('click', unlockAudio);
document.addEventListener('touchstart', unlockAudio);

function GameWrapper() {
    const { gameId } = useParams<{ gameId: string }>();
    return <Game key={gameId} />;
}

export default function App() {
    return (
        <SettingsProvider>
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
                        <Route path="/articles/editor" element={<Layout><ArticleEditor /></Layout>} />
                        <Route path="/articles/editor/:id" element={<Layout><ArticleEditor /></Layout>} />
                        <Route path="/articles/:id" element={<Layout><Article /></Layout>} />
                        <Route path="/clive" element={<Layout><Clive /></Layout>} />
                        <Route path="/diet" element={<Layout><Diet /></Layout>} />
                        <Route path="/settings" element={<Layout><Settings /></Layout>} />
                        <Route path="/logout" element={<Layout><Logout /></Layout>} />
                    </Routes>
                </Router>
            </WebSocketProvider>
        </AuthProvider>
        </ThemeProvider>
        </SettingsProvider>
    );
}
