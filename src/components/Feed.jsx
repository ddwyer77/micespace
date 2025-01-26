import React, { useState, useEffect } from "react";
import { getFileUrl } from "../utils/storage.js";
import { motion } from "framer-motion";

const Feed = () => {
    const [generatedVideos, setGeneratedVideos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handlePrev = () => {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? generatedVideos.length - 1 : prevIndex - 1));
    };
  
    const handleNext = () => {
      setCurrentIndex((prevIndex) => (prevIndex === generatedVideos.length - 1 ? 0 : prevIndex + 1));
    };

    useEffect(() => {
      const fetchGeneratedVideos = async () => {
          try {
              const response = await getFileUrl('generatedVideos/');
              const shuffledVideos = shuffleArray(response);
              const selectedVideos = shuffledVideos.slice(0, 10);
              setGeneratedVideos(selectedVideos);
          } catch (error) {
              console.error("Error fetching generated videos:", error);
          }
      };

      fetchGeneratedVideos();
  }, []);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

  return (
<div className="relative w-full max-w-3xl mx-auto overflow-hidden">
      <div className="relative flex items-center justify-center h-64">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="absolute w-full h-full flex items-center justify-center"
        >
          <video className="w-full h-full object-cover rounded-2xl shadow-lg" controls autoPlay muted loop alt={`Slide ${currentIndex}`}>
                 <source src={generatedVideos[currentIndex]} type="video/mp4"/>
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
      <div className="absolute bottom-4 flex justify-center w-full space-x-2">
        {generatedVideos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-gray-800" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>


  );
};

export default Feed;