import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, MessageSquareIcon, BugIcon, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Feedback button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="mb-4 flex items-center justify-end"
            >
              <div className="relative flex items-center">
                <span className="mr-2 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                  Feedback
                </span>
                <a
                  target="_blank"
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfD1AvX5zQStGElmjZ3B_piSAu8xa2ScRnZt9fSMgL7Q6dpFQ/viewform?usp=sharing"
                >
                  <Button
                    size="icon"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center"
                    onClick={() => console.log('Feedback clicked')}
                  >
                    <MessageSquareIcon className="h-5 w-5" />
                    <span className="sr-only">Feedback</span>
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Bug Report button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mb-4 flex items-center justify-end"
            >
              <div className="relative flex items-center">
                <span className="mr-2 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                  Bug Report
                </span>
                <a
                  target="_blank"
                  href="https://github.com/TheFirewall-code/TheFirewall-Secrets-SCA/issues/new"
                >
                  <Button
                    size="icon"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center"
                    onClick={() => console.log('Bug Report clicked')}
                  >
                    <BugIcon className="h-5 w-5" />
                    <span className="sr-only">Bug Report</span>
                  </Button>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main toggle button */}
      <Button
        size="icon"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
        onClick={toggleMenu}
      >
        {isOpen ? <XIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
        <span className="sr-only">Toggle menu</span>
      </Button>
    </div>
  );
};

export default FloatingActionButton;
