import './App.css';
import { ThemeProvider } from '@/components/theme-provider';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import { useTheme } from '@/components/theme-provider';
import FloatingActionButton from './components/FloatingActionButton';

function App() {
  const { theme } = useTheme();

  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <main className="flex-1 p-4">
          <RouterProvider router={router} />
          <Toaster theme={theme as 'light' | 'dark'} />
          <FloatingActionButton />
        </main>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
