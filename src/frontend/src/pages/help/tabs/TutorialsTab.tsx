import { useState } from 'react';
import { motion } from 'framer-motion';

const TutorialsTab = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Updated tutorial videos data
  const tutorials = [
    {
      id: '1',
      title: 'Setup Okta SSO COnfiguration Guide',
      thumbnail: 'https://img.youtube.com/vi/LP4sEYOuEv4/maxresdefault.jpg',
      videoId: 'LP4sEYOuEv4',
    },
    {
      id: '2',
      title: 'Setup RBAC and User Management',
      thumbnail: 'https://img.youtube.com/vi/cn_GzDEWfek/maxresdefault.jpg',
      videoId: 'cn_GzDEWfek',
    },
    {
      id: '3',
      title: 'How to Configure Slack/JIRA Settings ',
      thumbnail: 'https://img.youtube.com/vi/z__blsP9t4o/maxresdefault.jpg',
      videoId: 'z__blsP9t4o',
    },
    {
      id: '4',
      title: 'How to Manage Version Control System',
      thumbnail: 'https://img.youtube.com/vi/h4c-wRCy9oM/maxresdefault.jpg',
      videoId: 'h4c-wRCy9oM',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Video Tutorials</h2>
        <p className="mt-2 text-muted-foreground">
          Learn how to make the most of TheFirewall platform with our video guides
        </p>
      </div>

      {/* Video Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {tutorials.map((tutorial) => (
          <motion.div
            key={tutorial.id}
            variants={itemVariants}
            className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow hover:shadow-lg transition-all duration-300"
          >
            <div
              className="relative aspect-video cursor-pointer"
              onClick={() => setSelectedVideo(tutorial)}
            >
              <img
                src={tutorial.thumbnail}
                alt={tutorial.title}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium line-clamp-2">{tutorial.title}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
              onClick={() => setSelectedVideo(null)}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Link to Full Playlist */}
      <div className="text-center mt-8">
        <a
          href="https://www.youtube.com/playlist?list=PLcA3BglulRz-Cyr7U_wZ1XkU50J3fV-YL"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <span>View Full Playlist on YouTube</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M15 3h6v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 14L21 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default TutorialsTab;
