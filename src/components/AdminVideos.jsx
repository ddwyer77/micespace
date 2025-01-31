import React, { useState, useEffect } from "react";
import { getFileUrl, getCollectionDocs, updateDocument, deleteDocument, deleteFile } from "../utils/storage.js";
import { useInView } from "react-intersection-observer";
import Loader from "./Loader";
import axios from "axios";
import { initializeFirebase } from "../utils/storage";
import { collection, getDocs } from "firebase/firestore";

const AdminVideos = () => {
    const [generatedVideos, setGeneratedVideos] = useState([]);
    const [thumbnails, setThumbnails] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOption, setFilterOption] = useState("all");
    const [sortOption, setSortOption] = useState("");

    useEffect(() => {
        const fetchVideos = async () => {
          try {
            const videos = await getCollectionDocs("videos");
            setGeneratedVideos(videos);
          } catch (error) {
            console.error("Error fetching videos:", error);
          }
        };
      
        fetchVideos();
    }, []);

    const filteredVideos = generatedVideos
    // 1) Search Filter (by 'id' or 'url')
    .filter((vid) => {
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return (
        vid.id.toLowerCase().includes(lowerSearch) ||
        (vid.url && vid.url.toLowerCase().includes(lowerSearch))
      );
    })
    // 2) Dropdown Filter
    .filter((vid) => {
      switch (filterOption) {
        case "inFeedTrue":
          return vid.inFeed === true;
        case "inFeedFalse":
          return vid.inFeed === false;
        case "approvedTrue":
          return vid.isApproved === true;
        case "approvedFalse":
          return vid.isApproved === false;
        default:
          // 'all' or unrecognized -> return everything
          return true;
      }
    })
    // 3) Sort by createdAt if desired
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0; // If missing the field, skip
      if (sortOption === "createdAtAsc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortOption === "createdAtDesc") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return (
        <div>
            <h1 className="w-full text-center mt-6">Generated Videos</h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center my-4 px-4">
                {/* Search Bar */}
                <input
                type="text"
                placeholder="Search by ID or URL"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-2 rounded w-full max-w-80"
                />

                {/* Filter Dropdown */}
                <select
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value)}
                className="border p-2 rounded w-full max-w-80"
                >
                <option value="all">All</option>
                <option value="inFeedTrue">In Feed = true</option>
                <option value="inFeedFalse">In Feed = false</option>
                <option value="approvedTrue">Approved = true</option>
                <option value="approvedFalse">Approved = false</option>
                </select>

                {/* Sort Dropdown */}
                <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="border p-2 rounded w-full max-w-80"
                >
                <option value="">Sort by Created Date</option>
                <option value="createdAtAsc">CreatedAt Ascending</option>
                <option value="createdAtDesc">CreatedAt Descending</option>
                </select>
            </div>



            {filteredVideos.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
                {filteredVideos.map((vid, index) => (
                    <VideoCard 
                    key={vid.id} 
                    videoUrl={vid.url} 
                    thumbnailUrl={thumbnails[index]} 
                    docId={vid.id} 
                    setGeneratedVideos={setGeneratedVideos}      
                    isApproved={vid.isApproved || false}
                    inFeed={vid.inFeed || false} />
                ))}
            </div>
            ) : (
                <div className="w-full flex justify-center">
                    <Loader />
                </div>
            )}
        </div>

    );
};

const VideoCard = ({ videoUrl, thumbnailUrl, docId, setGeneratedVideos, isApproved, inFeed }) => {
    const [approvedChecked, setApprovedChecked] = useState(isApproved);
    const [feedChecked, setFeedChecked] = useState(inFeed);
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const handleDelete = async (id, url) => {
        const userConfirmed = window.confirm(
          "Are you sure? This cannot be undone."
        );
        if (!userConfirmed) return;
    
        try {
          await deleteDocument(id);


          const rawPath = decodeURIComponent(url.split("/").pop().split("?")[0]);
          const fileName = rawPath.split("/").pop();

            // Delete the video from the storage buckets
            const deleteFromBucket = async (bucketPath) => {
                const files = await getFileUrl(bucketPath);
                const fileToDelete = files.find((fileUrl) =>
                    decodeURIComponent(fileUrl).includes(fileName)
                );
                if (fileToDelete) {
                    const filePath = `${bucketPath}/${fileName}`;
                    await deleteFile(filePath);
                    console.log(`Deleted file: ${filePath}`);
                }
            };

            try {
                await deleteFromBucket('generatedVideos');
            } catch (error) {
                console.error("Error deleting from generatedVideos:", error);
            }

            try {
                await deleteFromBucket('generatedVideosUnapproved');
            } catch (error) {
                console.error("Error deleting from generatedVideosUnapproved:", error);
            }


            setGeneratedVideos((prev) => prev.filter((vid) => vid.id !== id));
        } catch (error) {
          console.error("Error deleting video:", error);
        }
    };

    const handleApprovedChange = async (event) => {
        const newValue = event.target.checked;
        setApprovedChecked(newValue);
    
        // Immediately update the doc in Firestore
        try {
          await updateDocument("videos", docId, { isApproved: newValue });
        } catch (error) {
          console.error("Error updating isApproved:", error);
        }
      };
    
      // Toggle "In Feed"
      const handleFeedChange = async (event) => {
        const newValue = event.target.checked;
        setFeedChecked(newValue);
    
        // Immediately update the doc in Firestore
        try {
          await updateDocument("videos", docId, { inFeed: newValue });
        } catch (error) {
          console.error("Error updating inFeed:", error);
        }
      };

    return (
        <div ref={ref} className="relative flex items-center justify-center w-full flex-col shadow-lg rounded-2xl p-4">
            <div className="max-h-[600px]">
                {inView ? (
                    <video
                        className="w-full h-full object-cover rounded-2xl"
                        controls
                        id={docId}
                    >
                        <source src={videoUrl} type="video/mp4" />
                    </video>
                ) : (
                    <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover rounded-2xl"
                    />
                )}
            </div>
            
            <div className="flex flex-start w-full mt-2">
                <div className="w-full">
                    <div className="flex">
                        <div className="bg-white flex align-center gap-2 p-2 rounded-lg">
                            <input 
                                type="checkbox"
                                checked={feedChecked}
                                onChange={handleFeedChange}
                                className="bg-primary z-10 hover:cursor-pointer" 
                            />
                            <label>In Feed</label>
                        </div>
                        <div className="bg-white flex align-center gap-2 p-2 rounded-lg">
                            <input 
                                type="checkbox" 
                                checked={approvedChecked}
                                onChange={handleApprovedChange}
                                className="bg-primary z-10 hover:cursor-pointer" 
                            />
                            <label>Approved</label>
                        </div>
                    </div>
                    <button className="bg-primary hover:bg-primary-dark text-white w-full" onClick={() => handleDelete(docId, videoUrl)}>Delete</button>
                </div>
            </div>
        </div>
    );
};

export default AdminVideos;