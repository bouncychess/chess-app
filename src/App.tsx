import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Play from './pages/Play/Play';
import Login from './pages/Login/Login';
import Logout from './pages/Logout/Logout';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { WebSocketProvider } from './context/WebSocketContext';

export default function App() {
    return (
        <WebSocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
                    <Route path="/play" element={<ProtectedRoute><Layout><Play /></Layout></ProtectedRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/logout" element={<Logout />} />
                </Routes>
            </Router>
        </WebSocketProvider>
    );
}