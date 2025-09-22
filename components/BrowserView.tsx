import React from 'react';

interface BrowserViewProps {
  /**
   * The URL of the BrowserBase session live view.
   */
  viewUrl: string | null;
}

/**
 * A component to render the BrowserBase session in an iframe.
 * It includes security and functionality attributes as recommended by the BrowserBase documentation.
 */
const BrowserView: React.FC<BrowserViewProps> = ({ viewUrl }) => {
  if (!viewUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg">
        <p className="text-gray-600">Browser session not started. Waiting for URL...</p>
      </div>
    );
  }

  return (
    <iframe
      src={viewUrl}
      // It is recommended to allow same-origin and scripts for full interactivity
      sandbox="allow-same-origin allow-scripts"
      // Allow clipboard and fullscreen for a better user experience
      allow="clipboard-write; fullscreen"
      width="100%"
      height="100%"
      className="border-0 rounded-lg shadow-md"
      title="BrowserBase Live Session"
    ></iframe>
  );
};

export default BrowserView;
