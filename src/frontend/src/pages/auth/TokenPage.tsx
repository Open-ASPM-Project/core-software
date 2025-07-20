import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface DecodedToken {
  exp: number;
  iat: number;
  role: string;
  user_id: number;
  username: string;
}

const TokenPage = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const processToken = async () => {
      try {
        const token = searchParams.get('access_token');

        if (!token) {
          setError('No access token found');
          return;
        }

        // Decode the token
        const decoded = jwtDecode<DecodedToken>(token);

        // Store necessary information from decoded token
        localStorage.setItem('role', decoded.role);
        localStorage.setItem('userId', decoded.user_id.toString());
        localStorage.setItem('username', decoded.username);

        // Continue with login after a delay
        setTimeout(() => {
          login(token);
          // Redirect to home or dashboard after successful login
          navigate('/');
        }, 1000);
      } catch (error) {
        console.error('Error processing token:', error);
        setError('Failed to process authentication token');
        // Optionally redirect to login page after error
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    processToken();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <div className="text-sm text-muted-foreground">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <div className="text-sm text-muted-foreground">Processing your login...</div>
    </div>
  );
};

export default TokenPage;
