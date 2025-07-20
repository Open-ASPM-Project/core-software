import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Settings, LogOut, KeyRound, HelpCircle } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';
import { ProductNavigation } from './components/ProductNavigation';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/images/logo.png';
import ResetPasswordDialog from '../dialogs/ResetPasswordDialog';

const MainHeader = ({ setProduct }: { setProduct: (product: number | null) => void }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    // The AuthContext will handle the state update and the PublicRoute will handle redirection
  };

  const handleResetPassword = () => {
    setIsResetPasswordOpen(true);
  };

  const handleHeaderClick = () => {
    const currentPath = window.location.pathname;

    if (currentPath.includes('/sca/')) {
      navigate('/sca/dashboard');
    } else if (currentPath.includes('/secret/')) {
      navigate('/secret/dashboard');
    } else {
      navigate('/secret/dashboard');
    }
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* Logo Section */}
        <div className="flex items-center space-x-4">
          <div className="font-bold text-xl cursor-pointer" onClick={handleHeaderClick}>
            OpenASPM
          </div>
          <ProductNavigation setProduct={setProduct} />
        </div>

        {/* Right Section - Profile & Actions */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Notifications */}
          {/* <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
          </Button> */}

          {/*  */}
          <ModeToggle />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {localStorage.getItem('username')}
                  </p>
                  {/* <p className="text-xs leading-none text-muted-foreground">john@example.com</p> */}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {localStorage.getItem('role') == 'admin' && (
                <DropdownMenuItem onClick={() => navigate('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              {localStorage.getItem('role') == 'admin' && (
                <DropdownMenuItem onClick={() => navigate('help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleResetPassword}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Reset Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ResetPasswordDialog
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
      />
    </header>
  );
};

export default MainHeader;
