import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Signup from './pages/signup';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Script from './pages/script';
import Navigator from './pages/navigator';
import Footer from './components/footer';
import './App.css';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/script" element={<ProtectedRoute><Script /></ProtectedRoute>} />
            <Route path="/navigator" element={<ProtectedRoute><Navigator /></ProtectedRoute>} />
          </Routes>
        </Router>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
