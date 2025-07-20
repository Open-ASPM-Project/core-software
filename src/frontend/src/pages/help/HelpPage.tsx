import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, Youtube } from 'lucide-react';
import FAQTab from './tabs/FAQTab';
import TutorialsTab from './tabs/TutorialsTab';

// Main Help Page Component
const HelpPage = () => {
  const [currentTab, setCurrentTab] = useState('faq');

  const handleBack = () => {
    // Handle navigation based on your app's requirements
    window.history.back();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4">
          <Button onClick={handleBack} variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Help Center</h2>
            <p className="text-muted-foreground">
              Find answers and learn how to make the most of our platform.
            </p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              Video Tutorials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <FAQTab />
          </TabsContent>

          <TabsContent value="tutorials">
            <TutorialsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HelpPage;
