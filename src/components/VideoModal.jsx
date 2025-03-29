import React from "react";

const VideoModal = ({ videoUrl, onClose }) => {
  return (
    <div className="absolute h-screen z-50 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="relative w-full max-w-4xl mx-auto p-4 bg-black rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-xl font-bold"
        >
          ✕
        </button>
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full h-auto rounded-xl"
        />
      </div>
    </div>
  );
};

export default VideoModal;
