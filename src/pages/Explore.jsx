import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCollectionDocs } from "../utils/storage.js";
import Modal from "../components/Modal.jsx";
import Loader from "../components/Loader.jsx";
import { useInView } from "react-intersection-observer";
import videoPlaceholder from "../assets/images/video-placeholder.png";

const VideoCard = ({ videoUrl, onClick }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const handleMouseEnter = (e) => e.target.play();

  const handleMouseLeave = (e) => {
    e.target.pause();
    e.target.currentTime = 0; // Reset to the start
  };

  return (
    <div
      ref={ref}
      className="aspect-9-16 overflow-hidden rounded-md cursor-pointer"
      onClick={onClick}
    >
      {inView ? (
        <video
          src={videoUrl}
          muted
          loop
          className="w-full h-48 object-cover"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      ) : (
        <img
          className="w-full h-48 animate-pulse rounded-md"
          src={videoPlaceholder}
          alt="Video placeholder"
        />
      )}
    </div>
  );
};

const Explore = () => {
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Shuffle Function
  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError("");

      try {
        const videos = await getCollectionDocs("videos");
        if (videos.length > 0) {
          const shuffledVideos = shuffleArray(videos).slice(0, 30);
          setGeneratedVideos(shuffledVideos);
        } else {
          setError("No videos found. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        setError(
          "Failed to load videos. Please check your connection and try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Modal Handling
  const handleVideoClick = (videoUrl) => setSelectedVideo(videoUrl);
  const closeModal = () => setSelectedVideo(null);

  return (
    <div className="flex min-h-screen justify-start items-start flex-col p-4 mt-24">
      <div className="max-w-2xl flex flex-col gap-4">
        <div className="py-8 md:min-w-[42rem] rounded-md bg-gray-100">
          <div className="flex flex-col gap-1 max-w-[28rem] mx-auto">
            <h1 className="text-lg text-center font-bold text-black">
              The BEST last-frame AI meme content generator.
            </h1>
            <p className="text-xs text-center">
              Automatically mix, match, and morph any video with your own AI
              creation.
            </p>
            <button
              onClick={() => navigate("/create")}
              className="bg-primary-light text-sm"
            >
              Try Now
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center w-full h-64">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {generatedVideos.map((video) => (
              <VideoCard
                key={video.id}
                videoUrl={video.url}
                onClick={() => handleVideoClick(video.url)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Video Modal */}
      <Modal isOpen={!!selectedVideo} onClose={closeModal}>
        {selectedVideo && (
          <div className="flex justify-center">
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full max-w-[20rem] h-auto md:max-w-[25rem]"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Explore;
