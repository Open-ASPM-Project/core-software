import * as React from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Package2, Layers, ChevronRight, Shield } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

export function ProductNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentProduct = () => {
    if (location.pathname.includes('/secret')) return 'Secrets';
    if (location.pathname.includes('/sca')) return 'SCA';
    if (location.pathname.includes('/vm')) return 'VM';
    return 'Products';
  };

  const getCurrentIcon = () => {
    if (location.pathname.includes('/secret')) return <Lock className="w-4 h-4 mr-2" />;
    if (location.pathname.includes('/sca')) return <Layers className="w-4 h-4 mr-2" />;
    if (location.pathname.includes('/vm')) return <Shield className="w-4 h-4 mr-2" />;
    return <Package2 className="w-4 h-4 mr-2" />;
  };

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            {getCurrentIcon()}
            {getCurrentProduct()}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[600px] p-6">
              <div className="grid gap-6 grid-cols-2">
                <ProductCard
                  icon={<Lock className="w-6 h-6" />}
                  title="Secrets"
                  description="Automatically detect and prevent exposure of sensitive keys across your codebase."
                  onClick={() => handleNavigation('/secret/dashboard')}
                  className="hover:border-blue-500/50 hover:shadow-blue-500/25 text-left"
                />
                <ProductCard
                  icon={<Layers className="w-6 h-6" />}
                  title="SCA"
                  description="Continuously monitor and identify security vulnerabilities across your codebase."
                  onClick={() => handleNavigation('/sca/dashboard')}
                  className="hover:border-blue-500/50 hover:shadow-blue-500/25 text-left"
                />
                <ProductCard
                  icon={<Shield className="w-6 h-6" />}
                  title="VM"
                  description="Comprehensive vulnerability management to assess, prioritize, and remediate security risks."
                  onClick={() => handleNavigation('/vm/dashboard')}
                  className="hover:border-blue-500/50 hover:shadow-blue-500/25 text-left"
                />
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

interface ProductCardProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  onClick?: () => void;
  badge?: string;
  className?: string;
}

const ProductCard = ({ icon, title, description, onClick, badge, className }: ProductCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative group rounded-xl border bg-card p-6 transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02]',
        'active:scale-[0.98]',
        className
      )}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="flex-1 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </button>
  );
};

export default ProductNavigation;
