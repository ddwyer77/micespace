import React, { useState, useEffect } from "react";
import axios from "axios";
import loadingMessages from "../utils/loadingMessages.js";
import mergeVideos from "../utils/mergeVideos.js";
import { getFileUrl, uploadFile } from "../utils/storage.js";
import trimVideo from "../utils/trimVideo.js";
import getLastFrame from "../utils/getLastFrame.js";
import uploadGeneratedVideosForFeed from "../utils/uploadGeneratedVideosForFeed.js";
import logoSlogan from '../assets/images/logo_slogan.png'

function VideoGenerator() {
    const [videoFile, setVideoFile] = useState(null); // Uploaded video file
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0); 
    const audioUrl = "https://firebasestorage.googleapis.com/v0/b/mice-band.firebasestorage.app/o/audio%2FMicebandoglink.m4a?alt=media&token=3350faaf-1949-432f-aaeb-64d27af57d5e";
    const clipLength = 4;

    const apiKeyMiniMaxi = import.meta.env.VITE_API_KEY_MINIMAXI;
    const apiKeyShotStack = import.meta.env.VITE_API_KEY_SHOTSTACK;
    const model = "video-01";

    // Cycle through loading messages
    useEffect(() => {        
        if (!loading) return;

        const interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [loading]);

    // Handle video upload
    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideoFile(file);
            setStatus(""); // Reset status
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
            } catch (error) {
                console.error("Error uploading file:", error);
                handleCriticalError("Failed to upload video.");
                return;
            }


            // ********************************************
            // *     Trim Video To 4 Seconds
            // ********************************************
            try {
                handleUpdateStatus("Trimming video...", 20);
                trimmedVideoUrl = await trimVideo(originalVidUrl, apiKeyShotStack);
            } catch (error) {
                console.error("Error:", error);
                handleCriticalError("Failed to trim video.");
                return;
            }

            // ********************************************
            // *     Fetch Last Frame
            // ********************************************
            try {
                handleUpdateStatus("Fetching last frame...", 30);
                // lastFrameDataUrl = await getLastFrame(trimmedVideoUrl); 
                lastFrameDataUrl = await getLastFrame(trimmedVideoUrl, apiKeyShotStack, clipLength);
                console.log(lastFrameDataUrl);
            } catch (error) {
                console.error("Error fetching last frame:", error);
                handleCriticalError("Failed to fetch last frame.");
                return;
            }
            
                        
            // ********************************************
            // *     Send Request to MiniMaxi 
            // ********************************************
            handleUpdateStatus("Generating Mice Video...", 40);
            const createTaskResponse = await axios.post(
                "https://api.minimaxi.chat/v1/video_generation",
                {
                    model,
                    prompt: "Camera pans over and down and there is a band of realistic mice rocking out and jamming and playing drums and guitar.",
                    first_frame_image: lastFrameDataUrl,
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKeyMiniMaxi}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            const { task_id } = createTaskResponse.data;

            // Poll MiniMaxi service for video generation completion
            let taskStatus = "Queueing";
            let generatedVideoUrl = "";

            while (["Queueing", "Processing", "Preparing"].includes(taskStatus)) {
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

                const queryResponse = await axios.get(
                    `https://api.minimaxi.chat/v1/query/video_generation?task_id=${task_id}`,
                    {
                        headers: { Authorization: `Bearer ${apiKeyMiniMaxi}` },
                    }
                );

                const { status, file_id } = queryResponse.data;
                taskStatus = status;

                if (["Queueing", "Processing", "Preparing"].includes(taskStatus) && status !== taskStatus) {
                    setStatus(taskStatus);
                }

                if (taskStatus === "Queueing") {
                    handleUpdateStatus("Video generation is in the queue...", 50);
                } else if (taskStatus === "Processing") {
                    handleUpdateStatus("Video generation is in progress. This step takes a while.", 55);
                } else if (taskStatus === "Preparing") {
                    handleUpdateStatus("Preparing the video...", 60);
                }

                if (status === "Success") {
                    const fetchResponse = await axios.get(
                        `https://api.minimaxi.chat/v1/files/retrieve?file_id=${file_id}`,
                        {
                            headers: { Authorization: `Bearer ${apiKeyMiniMaxi}` },
                        }
                    );
                    generatedVideoUrl = fetchResponse.data.file.download_url;
  

                    // ********************************************
                    // *     Merge Videos
                    // ********************************************
                    const videoUrls = [trimmedVideoUrl, generatedVideoUrl];
                    try {
                        const mergedVideoUrl = await mergeVideos(videoUrls, apiKeyShotStack, audioUrl, clipLength);
                        setDownloadUrl(mergedVideoUrl);
                        handleUpdateStatus("Video generated successfully.", 100);
                        
                        try {
                            uploadGeneratedVideosForFeed(downloadUrl);
                        } catch (error) {
                            console.warn("Failed to upload generated video for feed:", error);
                        }

                    } catch (mergeError) {
                        console.error("Failed to merge videos:", mergeError);
                        setStatus("Failed to merge videos.");
                    }

                    break;
                } else if (status === "Fail") {
                    setStatus("AI video generation failed.");
                    console.error("AI video generation failed.");
                    setLoading(false);
                    return;
                }
            }
        } catch (error) {
            setStatus("An error occurred. Please try again.");
            console.error(error);
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
                <a
                href={downloadUrl}
                download
                className="block bg-green-600 text-white hover:text-white hover:bg-green-700 px-4 rounded-lg w-full text-center py-4"
                >
                Download Video
                </a>
            )}
        </div>
    );
}

export default VideoGenerator;
