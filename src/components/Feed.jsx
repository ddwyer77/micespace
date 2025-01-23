import React, { useState, useEffect } from "react";
import { getFileUrl } from "../utils/storage.js";
import VideoCard from "./VideoCard.jsx";

const Feed = () => {
  const [generatedVideos, setGeneratedVideos] = useState([]);

  useEffect(() => {
    const fetchGeneratedVideos = async () => {
      try {
        const response = await getFileUrl('generatedVideos/');
        setGeneratedVideos(response);
      } catch (error) {
        console.error("Error fetching generated videos:", error);
      }
    };

    fetchGeneratedVideos();
  }, []);

  return (
    <div>
      <h2>Generated Videos</h2>
      <ul>
        {generatedVideos.map((videoUrl, index) => (
          <li key={index}>
            <VideoCard videoUrl={videoUrl} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Feed;