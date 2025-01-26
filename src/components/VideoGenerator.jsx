import React, { useState, useEffect } from "react";
import axios from "axios";
import loadingMessages from "../utils/loadingMessages.js";
import { getFileUrl, uploadFile } from "../utils/storage.js";
import uploadGeneratedVideosForFeed from "../utils/uploadGeneratedVideosForFeed.js";
import logoSlogan from '../assets/images/logo_slogan.png'
import VideoDownloader from "./VideoDownloader.jsx";

function VideoGenerator() {
    const [videoFile, setVideoFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0); 
    const audioUrl = "https://firebasestorage.googleapis.com/v0/b/mice-band.firebasestorage.app/o/audio%2FMicebandoglink.m4a?alt=media&token=3350faaf-1949-432f-aaeb-64d27af57d5e";
    const clipLength = 5;
    const [ ingestedVideoId, setIngestedVideoId ] = useState("");
    let originalVidUrl = ""; 
    let ingestedVideoUrl = "";
    let trimmedVideoUrl = "";
    let lastFrameDataUrl = "";

    useEffect(() => {        
        if (!loading) return;
        const interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [loading]);

    const handleVideoUpload = async (event) => {
        setUploading(true);
        const file = event.target.files[0];
    
        if (!file) {
            console.error("No file selected");
            return;
        }
    
        setVideoFile(file);
        setStatus("");
    
        try {
            // Upload to Firebase
            handleUpdateStatus("Saving original video...", 0);
            const originalVidUrl = await uploadFile(file, `videos/${file.name}`);
            console.log("Uploaded Video:", originalVidUrl);
    
            // Compress the uploaded video
            handleUpdateStatus("Compressing video...", 0);
            const response = await axios.post("/.netlify/functions/compressVideo", { videoUrl: originalVidUrl, type: getFileExtension(file.name) });
            console.log("Compression Response:", response.data.data.id);
            setIngestedVideoId(response.data.data.id);
    
            handleUpdateStatus("Video uploaded.", 0);
            setUploading(false);
        } catch (error) {
            console.error("Error processing video:", error);
            handleCriticalError("Failed to process video.");
            setUploading(false);
        }
    };
      
    const getFileExtension = (filename) => {
        const match = filename.match(/\.([a-zA-Z0-9]+)$/);
        return match ? match[1].toLowerCase() : '';
    };

    const handleUpdateStatus = (message, progress) =>{
        setStatus(message);
        setProgress(progress);
    }

    const handleCriticalError = (message) => {
        setStatus(message);
        setProgress(0);
        setLoading(false);
    }

    const pollTaskStatus = async (task_id) => {
        try {
            let status = "Queueing";
            let generatedVideoUrl = "";

            while (["Queueing", "Processing", "Preparing"].includes(status)) {
                await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait 5 seconds

                const response = await axios.post("/.netlify/functions/checkTaskStatus", { task_id });
                const data = response.data;
                status = data.status;

                if (status === "Success") {
                    generatedVideoUrl = data.generatedVideoUrl;
                    return generatedVideoUrl;
                } else if (status === "Fail") {
                    throw new Error("Video generation failed.");
                }

                handleUpdateStatus(`Video generation status: ${status}`, 50);
            }
        } catch (error) {
            console.error("Error polling task status:", error);
            handleCriticalError("Failed to generate video.");
        }
    };

    const pollIngestedVideo = async (videoId, maxRetries = 30, delay = 5000) => {
        let retries = 0;
        while (retries < maxRetries) {
            try {
                const response = await axios.post("/.netlify/functions/getIngestedVideo", {
                    videoId,
                });
                const rendition = response.data.attributes.outputs.renditions[0];
                if (rendition && rendition.url) {
                    console.log("Ingested Video URL:", rendition.url);
                    return rendition.url;
                }
            } catch (error) {
                console.error(`Error getting ingested video (attempt ${retries + 1}):`, error.message);
            }
        
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries++;
        }
    
        throw new Error("Ingested video is not ready after maximum retries.");
    };

    const handleGenerateVideo = async () => {
        if (!videoFile) {
            handleUpdateStatus("Please upload a video file.", 0);
            return;
        }

        setLoading(true);
        handleUpdateStatus("Initializing process...", 5);

        try {
            // ********************************************
            // *     Get Ingested Video
            // ********************************************
            try {
                ingestedVideoUrl = await pollIngestedVideo(ingestedVideoId);
                console.log("Ingested Video Url:", ingestedVideoUrl);
            } catch (error) {
                console.error("Error getting ingested video:", error.message);
            }

            // ********************************************
            // *     Trim Video To 5 Seconds
            // ********************************************
            try {
                handleUpdateStatus("Trimming video...", 20);
                const response = await axios.post("/.netlify/functions/trimVideo", {
                  videoUrl: ingestedVideoUrl,
                  clipLength
                });
                trimmedVideoUrl = response.data.trimmedVideoUrl;
                console.log("Trimmed Video:", trimmedVideoUrl);
            } catch (error) {
                console.error(error);
                handleCriticalError("Failed to trim video.");
                return;
            }
            // ********************************************
            // *     Fetch Last Frame
            // ********************************************
            try {
                const response = await axios.post("/.netlify/functions/getLastFrame", {
                    trimmedVideoUrl,
                    clipLength,
                });
                lastFrameDataUrl = response.data.renderUrl;
                console.log("Last Frame:", lastFrameDataUrl);
            } catch (error) {
                console.error("Error fetching last frame:", error);
                handleCriticalError("Failed to fetch last frame.");
                throw error;
            }
                        
            // ********************************************
            // *     Send Request to MiniMaxi 
            // ********************************************
            handleUpdateStatus("Generating Mice Video...", 40);
            const response = await axios.post("/.netlify/functions/generateMiniMaxiVideo", {
                model: "video-01",
                prompt: "The Camera smoothly pans without delay over and down and there is a band of realistic mice rocking out and jamming and playing drums and guitar.",
                first_frame_image: lastFrameDataUrl,
            });

            const { task_id } = response.data;
            console.log("Task ID:", task_id);

            const generatedVideoUrl = await pollTaskStatus(task_id);
            console.log("Generated Video URL:", generatedVideoUrl);

            // Proceed to merge the videos
            const videoUrls = [trimmedVideoUrl, generatedVideoUrl];
            const mergeResponse = await axios.post("/.netlify/functions/mergeVideos", {
                videoUrls,
                audioUrl,
                clipLength,
            });

            const mergedVideoUrl = mergeResponse.data.renderUrl;
            console.log("Merged Video URL:", mergedVideoUrl);

            setDownloadUrl(mergedVideoUrl);
            handleUpdateStatus("Video generated successfully.", 100);

            try {
                await uploadGeneratedVideosForFeed(originalVidUrl, trimmedVideoUrl, mergedVideoUrl);
            } catch (error) {
                console.error("Error uploading generated videos for feed:", error);
            }

        } catch (error) {
            console.error("Error generating video:", error.message);
            handleCriticalError("Failed to generate video.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 justify-center items-center md:min-w-[600px]">
            <img src={logoSlogan} alt="micespace logo"/>
            <h2 className="text-lg font-bold">Your Mice Band Video Generator</h2>

            <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="block w-full mt-2 border rounded-lg p-2"
            />

            {(uploading || loading) ? (
                <button
                    disabled
                    className="bg-gray-200 text-white py-4 rounded-lg mt-4 w-full border-none"
                >
                    Loading...
                </button>
                ) : (
                <button
                    onClick={handleGenerateVideo}
                    disabled={loading || !videoFile}
                    className="bg-primary text-white py-4 hover:bg-primary-dark rounded-lg mt-4 w-full border-none"
                    style={{
                    cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Processing..." : "Generate Video"}
                </button>
            )}
            

            {loading && (
                <div className="mt-4 justify-center flex flex-col items-center w-full">
                    <div className="loading">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                        className="bg-primary h-4 rounded-full"
                        style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p>{loadingMessages[loadingMessageIndex]}</p>
                </div>
            )}

            {loading && (<p className="mt-4 text-gray-700">Your video is being processed. This could take up to 8 minutes. Please don't close the page.</p>)}
            {status && <p className="mt-4 text-gray-700">{status}</p>}

            {downloadUrl && (
                <div className="w-full flex flex-col gap-4">
                    <a
                        href={downloadUrl}
                        target="_blank"
                        download
                        className="block bg-green-600 text-white hover:text-white hover:bg-green-700 px-4 rounded-lg w-full text-center py-4"
                        >
                        View Video
                    </a>
                    <VideoDownloader videoUrl={downloadUrl} fileName="miceband_video.mp4" />
                </div>
            )}
        </div>
    );
}

export default VideoGenerator;
