import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Play from './pages/Play/Play';
import Login from './pages/Login/Login';
import Layout from './components/layout/Layout';
import { WebSocketProvider } from './context/WebSocketContext';

export default function App() {
    return (
        <WebSocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/play" element={<Layout><Play /></Layout>} />
                    <Route path="/login" element={<Login />} />
                </Routes>
            </Router>
        </WebSocketProvider>
    );
}