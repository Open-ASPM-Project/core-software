import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HomeIcon, MoveLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Card className="flex-1 border-none shadow-none bg-background">
      <CardContent className="flex flex-col items-center pt-6 pb-4 space-y-6">
        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-[120px] font-bold leading-none tracking-tight text-primary/10">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          </div>
        </div>

        {/* Description */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground max-w-[280px]">
            The page you're looking for doesn't exist or has been moved to another location.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[280px]">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-1/2 space-x-2"
          >
            <MoveLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
          <Button
            variant="default"
            onClick={() => navigate('/secret/dashboard')}
            className="w-full sm:w-1/2 space-x-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-xs text-muted-foreground">
          <span>Need help? Visit our </span>
          <a href="#" className="text-primary hover:underline">
            help center
          </a>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
          <div className="w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotFoundPage;
