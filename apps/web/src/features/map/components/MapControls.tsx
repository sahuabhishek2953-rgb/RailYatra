import React from 'react';
import { Plus, Minus, Compass, LocateFixed, Layers } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  isFollowing: boolean;
  toggleFollow: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  isFollowing,
  toggleFollow
}) => {
  return (
    <div className="absolute right-4 bottom-6 z-30 flex flex-col gap-2">
      {/* Re-center / Follow train button */}
      <button
        onClick={() => {
          onRecenter();
          toggleFollow();
        }}
        title="Re-center camera on live train"
        className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg backdrop-blur-md transition-all ${
          isFollowing
            ? 'bg-[#4F6EF7] text-white border-[#4F6EF7] shadow-[#4F6EF7]/30'
            : 'bg-gray-900/80 text-white border-gray-700/60 hover:bg-gray-800'
        }`}
      >
        <LocateFixed className={`h-5 w-5 ${isFollowing ? 'animate-spin' : ''}`} />
      </button>

      {/* Zoom controls */}
      <div className="flex flex-col rounded-xl border border-gray-700/60 bg-gray-900/80 shadow-lg backdrop-blur-md overflow-hidden text-white divide-y divide-gray-700/60">
        <button
          onClick={onZoomIn}
          className="flex h-9 w-9 items-center justify-center hover:bg-gray-800 transition-colors"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="flex h-9 w-9 items-center justify-center hover:bg-gray-800 transition-colors"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
