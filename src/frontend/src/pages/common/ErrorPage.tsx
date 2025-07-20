import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RotateCcw } from 'lucide-react';

const ErrorPage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Card className="w-[400px] bg-slate-900 border-slate-800">
      <CardContent className="flex flex-col items-center pt-6 pb-4 space-y-6">
        {/* Error Icon */}
        <div className="p-3 rounded-full bg-red-500/10">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>

        {/* Error Message */}
        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-semibold text-slate-100">Something went wrong</h3>
          <p className="text-sm text-slate-400">
            We encountered an error while processing your request. Please try again.
          </p>
        </div>

        {/* Retry Button */}
        <Button
          variant="default"
          onClick={handleRetry}
          className="space-x-2 bg-slate-800 hover:bg-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>

        {/* Additional Help Link */}
        <p className="text-xs text-slate-500">
          If the problem persists,{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline">
            contact support
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export default ErrorPage;
