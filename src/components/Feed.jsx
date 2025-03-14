import React, { useState, useEffect, useRef } from "react";
import { getFileUrl, getCollectionDocs } from "../utils/storage.js";
import { motion } from "framer-motion";
import { select } from "framer-motion/client";
import Loader from "./Loader";
import ThumbsUpIcon from "../assets/icons/ThumbsUpIcon.jsx";

const Feed = () => {
    const [generatedVideos, setGeneratedVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true); 
    const [loading, setLoading] = useState(true);
    
    const videoRef = useRef(null);

    const handlePrev = () => {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? generatedVideos.length - 1 : prevIndex - 1));
    };
  
    const handleNext = () => {
      setCurrentIndex((prevIndex) => (prevIndex === generatedVideos.length - 1 ? 0 : prevIndex + 1));
    };

  useEffect(() => {
    const fetchVideos = async () => {
        try {
            const videos = await getCollectionDocs("videos");
            const filteredVideos = videos.filter(video => video.inFeed === true && video.isApproved === true);
            const shuffledVideos = shuffleArray(filteredVideos);
            const selectedVideos = shuffledVideos.slice(0, 150);
            setGeneratedVideos(selectedVideos);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching videos:", error);
            setLoading(false);
        }
    };

    fetchVideos();
}, []);

  useEffect(() => {
      if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().catch((err) => {
              console.error("Autoplay failed:", err);
          });
      }
  }, [generatedVideos, currentIndex]);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

if (loading) {
  return <Loader />;
}

  return (
    <div className="relative w-full max-w-[340px] rounded-2xl">
      <div className="relative flex items-center justify-center h-[640px]">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="absolute w-full h-full flex items-center justify-center"
        >
          <video 
            className="w-full h-full object-cover rounded-2xl shadow-lg" 
            controls 
            autoPlay 
            muted={isMuted} 
            alt={`Slide ${currentIndex}`} 
            ref={videoRef} 
            onEnded={handleNext}
            onVolumeChange={() => setIsMuted(videoRef.current.muted)}
          >
                 <source src={generatedVideos[currentIndex].url} type="video/mp4"/>
          </video>
        </motion.div>
      </div>
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 focus:outline-none"
      >
        ◀
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 focus:outline-none"
      >
        ▶
      </button>
      <div className="absolute z-1 top-0 text-white p-3 hover:cursor-pointer hover:text-primary">
        <ThumbsUpIcon/>
        <span>Like</span>
      </div>
    </div>


  );
};

export default Feed;