import React, { useState } from "react";
import exploreVids from "../utils/exploreVids";
import Modal from "../components/VideoModal";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

const Explore = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="p-4 min-h-screen">
      <ResponsiveMasonry
        columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1280: 4 }}
        gutterBreakpoints={{ 350: "12px", 750: "16px", 900: "20px", 1280: "24px" }}
      >
        <Masonry>
          {exploreVids.map((vid) => (
            <VideoCard
              key={vid.url}
              video={vid}
              isHovered={hoveredId === vid.url}
              onClick={() => setSelectedVideo(vid.url)}
              onHover={() => setHoveredId(vid.url)}
              onUnhover={() => setHoveredId(null)}
            />
          ))}
        </Masonry>
      </ResponsiveMasonry>

      {selectedVideo && (
        <Modal videoUrl={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
};

const VideoCard = ({ video, onClick, onHover, onUnhover }) => {
    return (
      <div
        className="break-inside-avoid cursor-pointer rounded-xl overflow-hidden w-full relative"
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onUnhover}
      >
        <img
          src={video.thumbnail}
          alt="thumbnail"
          className="w-full h-auto block pointer-events-none"
          style={{ visibility: "hidden" }}
        />
  
        <video
          src={video.url}
          muted
          loop
          playsInline
          preload="metadata"
          poster={video.thumbnail}
          className="absolute top-0 left-0 w-full h-full object-cover"
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
