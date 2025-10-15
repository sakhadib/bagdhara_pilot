import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, LogOut, Home } from 'lucide-react';

function Header({ title = "AMMA Research", showBackButton = false, backTo = "/dashboard" }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-4">
            {showBackButton && (
              <button
                onClick={() => navigate(backTo)}
                className="flex items-center px-2 md:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Back</span>
              </button>
            )}
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {currentUser && (
              <>
                <span className="hidden md:inline text-sm text-gray-600">
                  Welcome, {currentUser.email}
                </span>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center px-3 md:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Home className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 md:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;