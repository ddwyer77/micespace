import React, { useState } from "react";
import exploreVids from "../utils/exploreVids";
import Modal from "../components/VideoModal";

const Explore = () => {
  const [videos] = useState(exploreVids);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 p-4 space-y-4 [column-fill:_balance]">
        {videos.map((vid) => (
            <VideoCard
            key={vid.url}
            video={vid}
            isHovered={hoveredId === vid.url}
            onClick={() => setSelectedVideo(vid.url)}
            onHover={() => setHoveredId(vid.url)}
            onUnhover={() => setHoveredId(null)}
            />
        ))}

{selectedVideo && (
        <Modal videoUrl={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
};

const VideoCard = ({ video, onClick, onHover, onUnhover }) => {
    return (
      <div
        className="relative w-full aspect-[1] overflow-hidden rounded-xl cursor-pointer"
        onMouseEnter={onHover}
        onMouseLeave={onUnhover}
        onClick={onClick}
      >
        <video
          src={video.url}
          muted
          loop
          playsInline
          preload="metadata"
          poster={video.thumbnail}
          className="w-full h-full object-cover"
          onMouseEnter={(e) => e.target.play()}
          onMouseLeave={(e) => {
            e.target.pause();
            e.target.currentTime = 0;
          }}
        />
      </div>
    );
  };
  

export default Explore;
