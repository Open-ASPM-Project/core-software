import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const RootRouteHandler = () => {
  const { isAuthenticated } = useAuth();

  // Optional: Add loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking token validity or loading user data
    const checkAuth = async () => {
      try {
        // Add any additional auth checks here
        // e.g., validate token with backend
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Add your loading spinner or skeleton here */}
        <p>Loading...</p>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/secret/dashboard' : '/login'} replace />;
};

export default RootRouteHandler;
