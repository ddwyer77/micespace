import React, { useState, useEffect } from "react";
import axios from "axios";
import loadingMessages from "../utils/loadingMessages.js";
import mergeVideos from "../utils/mergeVideos.js";
import uploadVideo from "../utils/uploadVideo.js"; 

function VideoGenerator() {
    const [videoFile, setVideoFile] = useState(null); // Uploaded video file
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0); 

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

    const handleGenerateVideo = async () => {
        if (!videoFile) {
            setStatus("Please upload a video file.");
            return;
        }

        setLoading(true);
        setStatus("Initializing video...");
        setProgress(10);

        try {
            // const uploadedVideoUrl = await uploadVideo(videoFile, apiKeyShotStack);
            // console.log("Uploaded video URL:", uploadedVideoUrl);

            const videoElement = document.createElement("video");
            setStatus("Initializing video processing...");
            setProgress(20);
            videoElement.src = URL.createObjectURL(videoFile);
            videoElement.muted = false;

            const lastFrameDataUrl = await new Promise((resolve, reject) => {
                videoElement.onloadedmetadata = () => {
                videoElement.currentTime = videoElement.duration; // Seek to the last frame
                };

                videoElement.onseeked = () => {
                const canvas = document.createElement("canvas");
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/png"));
                };

                videoElement.onerror = () => reject(new Error("Failed to process video."));
            });

            setStatus("Extracting frames...");
            setProgress(30);

            // Send the last frame to the MiniMaxi service
            const createTaskResponse = await axios.post(
                "https://api.minimaxi.chat/v1/video_generation",
                {
                model,
                prompt: "Camera pans over and down and there is a band of mice rocking out and jamming and playing drums and guitar.",
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
            setStatus("Generating mice band video. This could take a while...");
            setProgress(40);

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
                    setStatus("Video generation is in the queue...");
                    setProgress(50);
                } else if (taskStatus === "Processing") {
                    setStatus("Video generation is in progress. This step takes a while.");
                    setProgress(60);
                } else if (taskStatus === "Preparing") {
                    setStatus("Preparing the video...");
                    setProgress(70);
                }

                if (status === "Success") {
                    const fetchResponse = await axios.get(
                        `https://api.minimaxi.chat/v1/files/retrieve?file_id=${file_id}`,
                        {
                        headers: { Authorization: `Bearer ${apiKeyMiniMaxi}` },
                        }
                    );

                    generatedVideoUrl = fetchResponse.data.file.download_url;
                    setProgress(75);
                    setStatus("Merging videos...");

                    // Merge Videos
                    const videoUrls = ["https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/footage/cliffs-sunset.mp4", generatedVideoUrl];
              
                    try {
                        const mergedVideoUrl = await mergeVideos(videoUrls,apiKeyShotStack);
                        setDownloadUrl(mergedVideoUrl);
                        setStatus("Video generated successfully.");
                        setProgress(100);
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
        <div className="flex flex-col gap-4 justify-center items-center">
        <h1 className="text-lg font-bold">Video Generator</h1>

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

        {loading && (<p className="mt-4 text-gray-700">Your video is being processed. This could take up to 5 minutes. Please don't close the page.</p>)}
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
