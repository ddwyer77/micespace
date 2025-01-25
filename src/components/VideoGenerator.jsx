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
    const [status, setStatus] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0); 
    const [isVerticalVideo, setIsVerticalVideo] = useState(false);
    const audioUrl = "https://firebasestorage.googleapis.com/v0/b/mice-band.firebasestorage.app/o/audio%2FMicebandoglink.m4a?alt=media&token=3350faaf-1949-432f-aaeb-64d27af57d5e";
    const clipLength = 5;

    useEffect(() => {        
        if (!loading) return;

        const interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [loading]);

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];


        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.src = url;
      
        video.onloadedmetadata = () => {
            const width = video.videoWidth;
            const height = video.videoHeight;
            setIsVerticalVideo(height > width);
            URL.revokeObjectURL(url);
        }


        if (file) {
            setVideoFile(file);
            setStatus(""); 
        }
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

    const handleGenerateVideo = async () => {
        if (!videoFile) {
            handleUpdateStatus("Please upload a video file.", 0);
            return;
        }

        setLoading(true);
        handleUpdateStatus("Initializing process...", 5);

        let originalVidUrl = ""; 
        let trimmedVideoUrl = "";
        let lastFrameDataUrl = "";

        try {
            // ********************************************
            // *     Upload Original Video To Firebase
            // ********************************************
            try {
                handleUpdateStatus("Saving original video...", 10);
                originalVidUrl = await uploadFile(videoFile, `videos/${videoFile.name}`);
                console.log("Uploaded Video:", originalVidUrl);
            } catch (error) {
                console.error("Error uploading file:", error);
                handleCriticalError("Failed to upload video.");
                return;
            }

            // ********************************************
            // *     Trim Video To 5 Seconds
            // ********************************************
            try {
                handleUpdateStatus("Trimming video...", 20);
                const response = await axios.post("/.netlify/functions/trimVideo", {
                  videoUrl: originalVidUrl,
                  clipLength,
                  isVerticalVideo,
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
            {/* <h1>MiceBand.com</h1> */}
            <img src={logoSlogan} alt="micespace logo"/>
            <h2 className="text-lg font-bold">Your Mice Band Video Generator</h2>

            <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="block w-full mt-2 border rounded-lg p-2"
            />

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
