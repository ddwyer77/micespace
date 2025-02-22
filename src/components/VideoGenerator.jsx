import React, { useState, useEffect } from "react";
import axios from "axios";
import loadingMessages from "../utils/loadingMessages.js";
import { getFileUrl, uploadFile, deleteFile, addDocument, getFirestoreData, getCollectionDocs } from "../utils/storage.js";
import uploadGeneratedVideosForFeed from "../utils/uploadGeneratedVideosForFeed.js";
import logoSlogan from '../assets/images/logo_slogan.png';
import VideoDownloader from "./VideoDownloader.jsx";
import Feed from './Feed';
import TikTokIcon from "../assets/icons/TikTokIcon.jsx";
import Modal from "./Modal.jsx";
import TermsOfService from "./TermsOfService.jsx";
import { toast } from "react-toastify";
import Card from "./Card.jsx";

function VideoGenerator() {
    const [ videoFile, setVideoFile ] = useState(null);
    const [ messageIsCritial, setMessageIsCritial ] = useState(false);
    const [ trimmedVideo, setTrimmedVideo ] = useState("");
    const [ loading, setLoading ] = useState(false);
    const [ uploading, setUploading ] = useState(false);
    const [ status, setStatus ] = useState("");
    const [ downloadUrl, setDownloadUrl ] = useState("");
    const [ loadingMessageIndex, setLoadingMessageIndex ] = useState(0);
    const [ progress, setProgress ] = useState(0);
    const [ isRedirectError, setIsRedirectError ] = useState(false);
    const [ campaigns, setCampaigns ] = useState([]);
    const [ currentCampaign, setCurrentCampaign ] = useState(0);
    const [ generationData, setGenerationData ] = useState(null);
    const clipLength = 5;
    const [ ingestedVideoId, setIngestedVideoId ] = useState("");
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ isPendingVideoModalOpen, setIsPendingVideoModalOpen ] = useState(false);
    const [ hasAcceptedTerms, setHasAcceptedTerms ] = useState(false);
    const [ showError, setShowError ] = useState(false);
    const [ currentVideoInProgressData, setCurrentVideoInProgressData ] = useState(null);
    const [isMerging, setIsMerging] = useState(false); 

    useEffect(() => {     
        if (!loading) return;
        const interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % generationData.loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        const storedData = localStorage.getItem("currentVideoInProgress");
    
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                if (
                    parsedData &&
                    typeof parsedData === "object" &&
                    parsedData.task_id &&
                    parsedData.trimmed_video_url &&
                    parsedData.task_id.trim() !== "" &&
                    parsedData.trimmed_video_url.trim() !== ""
                ) {
                    setCurrentVideoInProgressData(parsedData);
                    setIsPendingVideoModalOpen(true);
                } else {
                    console.warn("Invalid data structure in localStorage:", parsedData);
                    localStorage.removeItem("currentVideoInProgress"); // Clear invalid data
                }
            } catch (error) {
                localStorage.removeItem("currentVideoInProgress"); // Remove invalid entry
            }
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [])

    useEffect(() => {
        if (campaigns.length > 0 && !generationData) {
            setGenerationData({
                audioUrl: campaigns[0].audio,
                prompt: campaigns[0].prompt,
                generationType: campaigns[0].id,
                doubleGeneration: campaigns[0].doubleGeneration,
                loadingMessages: JSON.parse(campaigns[0].loadingMessages)
            });
        }
    }, [campaigns]);

    const fetchCampaigns = async () => {
        try {
            const campaigns = await getCollectionDocs("campaigns");
            const sortedCampaigns = campaigns.sort((a, b) => a.sort - b.sort);
            setCampaigns(sortedCampaigns);
            console.log("Campaigns:", campaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    }

    const handleVideoUpload = async (event) => {
        setUploading(true);
        const file = event.target.files[0];
    
        if (!file) {
            console.error("No file selected");
            return;
        }
    
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 150) {
            console.error("File is larger than 150 MB");
            handleCriticalError("*File must be 150 MB or smaller.");
            setUploading(false);
            return;
        }
    
        setVideoFile(file);
        setStatus("");
    
        const formData = new FormData();
        formData.append("video", file);
    
        try {
            handleUpdateStatus("Uploading and trimming video...", 0);
    
            const response = await axios.post("http://localhost:5000/api/trim-video", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                responseType: "blob", // Receive trimmed video as a file
            });
    
            const blob = new Blob([response.data], { type: "video/mp4" });
            const trimmedVideoUrl = URL.createObjectURL(blob);
            setTrimmedVideo(trimmedVideoUrl); // Store the trimmed video URL
    
            handleUpdateStatus("Video uploaded and trimmed.", 0);
            setUploading(false);
        } catch (error) {
            console.error("Error processing video:", error);
            handleCriticalError("Failed to process video.");
            setUploading(false);
        }
    };

    const extractLastFrame = async (videoBlobUrl) => {
        try {
            // Fetch the blob as a file
            const response = await fetch(videoBlobUrl);
            const blob = await response.blob();
            const file = new File([blob], "trimmed_video.mp4", { type: "video/mp4" });
    
            // Create FormData to send the file
            const formData = new FormData();
            formData.append("video", file);
    
            const serverResponse = await axios.post("http://localhost:5000/api/extract-last-frame", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                responseType: "blob", // Expect an image file as response
            });
    
            // Convert response to a blob URL
            const imageBlob = new Blob([serverResponse.data], { type: "image/jpeg" });
            const imageUrl = URL.createObjectURL(imageBlob);
            console.log("Extracted Frame URL:", imageUrl);
            return imageUrl;
        } catch (error) {
            console.error("Error extracting last frame:", error);
        }
    };

    const generateAIvideo = async (blobUrl, prompt) => {
        try {
            // Convert Blob to File
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const file = new File([blob], "frame.png", { type: "image/png" });
    
            // Upload the frame to the backend
            const formData = new FormData();
            formData.append("image", file);
            formData.append("prompt", prompt);
    
            const uploadResponse = await axios.post("http://localhost:5000/api/generate-video", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
    
            if (uploadResponse.data.task_id) {
                console.log("AI video generation started. Task ID:", uploadResponse.data.task_id);
                return uploadResponse.data.task_id;
            }
        } catch (error) {
            console.error("Error generating AI video:", error);
        }
    };
    
    const checkVideoStatus = async (taskId) => {
        try {
            const statusResponse = await axios.get(`http://localhost:5000/api/video-status/${taskId}`);
    
            if (statusResponse.data.status === "Success") {
                console.log("Video ready! File ID:", statusResponse.data.file_id);
                return statusResponse.data.file_id;
            } else {
                console.log("Still processing... Current status:", statusResponse.data.status);
                return null;
            }
        } catch (error) {
            console.error("Error checking video status:", error);
        }
    };
    
    const getAIvideo = async (fileId) => {
        try {
            const videoResponse = await axios.get(`http://localhost:5000/api/get-video/${fileId}`);
    
            if (videoResponse.data.download_url) {
                console.log("Download AI Video:", videoResponse.data.download_url);
                return videoResponse.data.download_url;
            }
        } catch (error) {
            console.error("Error retrieving AI video:", error);
        }
    };
    
    // Example: Call the AI video generation
    const processAIvideo = async (blobUrl) => {
        const taskId = await generateAIvideo(blobUrl, generationData.prompt);
    
        if (taskId) {
            // Poll the status every 10 seconds
            const interval = setInterval(async () => {
                const fileId = await checkVideoStatus(taskId);
                if (fileId) {
                    clearInterval(interval);
                    const videoUrl = await getAIvideo(fileId);
                    console.log("AI Video Ready:", videoUrl);
                    return videoUrl;
                }
            }, 10000);
        }
    };    

    const handleUpdateStatus = (message, progress) =>{
        setMessageIsCritial(false);
        setStatus(message);
        setProgress(progress);
    }

    const handleCriticalError = (message) => {
        setMessageIsCritial(true);
        setStatus(message);
        setProgress(0);
        setLoading(false);
        setIsRedirectError(true);
    }

    const handleCheckboxChange = (event) => {
        setHasAcceptedTerms(event.target.checked);
    };

    const handleSelectContent = (campaignIdx) => {
        setCurrentCampaign(campaignIdx);
        setGenerationData({
            audioUrl: campaigns[campaignIdx].audio,
            prompt: campaigns[campaignIdx].prompt,
            generationType: campaigns[campaignIdx].id,
            doubleGeneration: campaigns[campaignIdx].doubleGeneration,
            loadingMessages: JSON.parse(campaigns[campaignIdx].loadingMessages)
        });
    };

    

    async function uploadAndSaveVideo(mergedVideoUrl) {
        const storagePath = `generatedVideosUnapproved/video-${Date.now()}.mp4`;
        const videoTitle = storagePath.split('/').pop().split('.')[0];
    
        try {
            const downloadUrl = await uploadGeneratedVideosForFeed(mergedVideoUrl, storagePath);
            console.log("✅ Video uploaded to Firebase:", downloadUrl);
         
            const newDocId = await addDocument("videos", downloadUrl, videoTitle, generationData.generationType);
            console.log("✅ New item added:", newDocId);
    
            return downloadUrl;
        } catch (err) {
            console.error("❌ Error uploading or saving video:", err);
            throw err;
        }
    }

    // async function getDoubleVideoGeneration(firstGeneratedVideo) {
    //     const lastFrame = await getLastFrame(firstGeneratedVideo);
    //     handleUpdateStatus("Finishing up ai video generation...", 55);
    //     const aiGeneratedVideoTaskId = await getAiGeneratedVideoTaskId(lastFrame, generationData.prompt);
    //     const secondGeneratedVideo = await pollTaskStatus(aiGeneratedVideoTaskId.task_id);
    //     const videoUrls = [firstGeneratedVideo, secondGeneratedVideo];
    //     return videoUrls;
    // }

    const handleGenerateVideo = async () => {
        if (!videoFile) {
            handleUpdateStatus("Please upload a video file.", 0);
            toast.error("Please upload a video to start your generation.");
            return;
        }

        if (!hasAcceptedTerms) {
            setShowError(true);
            setTimeout(() => {
                setShowError(false);
            }, 5000);
            return;
        }

        setLoading(true);
        handleUpdateStatus("Initializing process...", 5);

        try {

            const lastFrame = await extractLastFrame(trimmedVideo);
                        
            // ********************************************
            // *     Send Request to MiniMaxi 
            // ********************************************
            handleUpdateStatus("Generating Video...", 40);
            const aiVideo = await processAIvideo(lastFrame);

            console.log("AI Video:", aiVideo);

            // ********************************************
            // *     Save Task In Case Of Refresh
            // ********************************************
            // const { task_id } = aiGeneratedVideoTaskId;
            // localStorage.setItem("currentVideoInProgress", JSON.stringify({"task_id": task_id, "trimmed_video_url": trimmedVideoUrl}));
            // toast.success("Your video is still generating. Progress saved. Please continue to wait...");
            // console.log("Task ID:", task_id);


        } catch (error) {
            console.error("Error generating video:", error.message);
            handleCriticalError("Failed to generate video.");
            document.write("Error generating video:", error.message);
        } finally {
            setLoading(false);
            if (isRedirectError) {
                window.location.href = "/error";
            }
        }
    };

    return (
        <div className="flex justify-center items-center w-screen flex-col p-4 mt-24 relative">
            <div className="max-w-2xl flex flex-col gap-4">
                <div className="flex flex-col gap-4 justify-center items-center md:min-w-[600px]">
                    <img src={logoSlogan} alt="micespace logo"/>

                    {/* ***** Upload ***** */}
                    <div className="w-full">
                        <h3 className="text-2xl font-bold w-full text-start mb-2">Upload a video</h3>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="block w-full mt-2 border rounded-lg p-2"
                        />
                    </div>

                    {/* ***** Select Content ***** */}
                    <div>
                        <h3 className="text-2xl font-bold w-full text-start mb-2">Select your content</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {campaigns.length > 0 && generationData ? (
                                campaigns
                                    .filter(campaign => campaign) // Ensure campaign is not undefined/null
                                    .map((campaign, idx) => (
                                        <Card 
                                            key={idx}
                                            onClick={() => handleSelectContent(idx)} 
                                            imageUrl={campaign?.image || ""} 
                                            name={campaign?.name || "Unknown"}
                                            isSelected={currentCampaign === idx} 
                                            loading={loading}
                                        />
                                    ))
                            ) : (
                                <p>Loading Campaigns...</p>
                            )}
                        </div>
                    </div>

                    {showError && <strong className="mt-4 text-red-600">Please accept the terms of service.</strong>}

                    {/* ***** Generate ***** */}
                    <div className="w-full">
                        <h3 className="text-2xl font-bold w-full text-start mb-2">Generate video</h3>
                        {(uploading || loading) ? (
                            <button
                                disabled
                                className="bg-gray-200 text-white py-4 rounded-lg w-full border-none"
                            >
                                Loading...
                            </button>
                            ) : (
                            <button
                                onClick={handleGenerateVideo}
                                disabled={loading}
                                className="bg-primary text-white py-4 hover:bg-primary-dark rounded-lg w-full border-none"
                                style={{
                                cursor: loading ? "not-allowed" : "pointer",
                                }}
                            >
                                {loading ? "Processing..." : "Generate Video"}
                            </button>
                        )}
                    </div>

                    <Modal isOpen={isPendingVideoModalOpen} onClose={() => setIsPendingVideoModalOpen(false)}>
                        <div className="flex flex-col items-center">
                            <h2>Pending video</h2>
                            <p>It looks like you may have had a video processing.</p>
                            {(!downloadUrl && isMerging) && (
                                <div>
                                    <div className="loading mx-auto">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                    <span>This could take up to 5 minutes.</span>
                                </div>
                            )}

                            <button
                                className={`px-4 py-2 rounded mt-4 block text-center w-full max-w-80 ${
                                    downloadUrl
                                        ? "bg-blue-600 text-white" // ✅ Download button when ready
                                        : "bg-green-600 text-white" // ✅ Retrieve button before merging
                                }`}
                                onClick={async () => {
                                    if (!downloadUrl && currentVideoInProgressData) {
                                        await mergeVideos(
                                            currentVideoInProgressData.trimmed_video_url,
                                            currentVideoInProgressData.task_id
                                        );
                                    } else {
                                        window.open(downloadUrl, "_blank");
                                    }
                                }}
                                disabled={isMerging}
                            >
                                {downloadUrl ? "Download Video" : isMerging ? "Retrieving Video..." : "Retrieve Video"}
                            </button>
                            <button onClick={()=>{
                                    localStorage.removeItem("currentVideoInProgress")
                                    setIsPendingVideoModalOpen(false)
                                }} 
                                className="bg-gray-300 px-4 py-2 rounded mt-4 block text-center w-full max-w-80">
                                Discard
                            </button>
                        </div>
                    </Modal>

                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    >
                        <TermsOfService />
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded mr-2">Ok</button>
                        </div>
                    </Modal>

                    <div>
                        <input type="checkbox" onChange={handleCheckboxChange} id="terms" name="terms" value="terms" className="mr-2 hover:cursor-pointer"/>
                        <label htmlFor="terms" className="text-gray-700">By generating a video, you agree to our <a className="hover:cursor-pointer" onClick={()=>setIsModalOpen(true)}>Terms of Service </a>and confirm that you have the rights to use any uploaded content. Videos must comply with all applicable laws and our content guidelines.</label>
                    </div>
                    

                    {loading && (
                        <div className="justify-center flex flex-col items-center w-full">
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
                            <p>{generationData.loadingMessages[loadingMessageIndex]}</p>
                        </div>
                    )}

                    {loading && (<p className="mt-4 text-gray-700">Your video is being processed. This could take up to 8 minutes. Please don't close the page.</p>)}
                    {status && <p className={`mt-4 ${messageIsCritial ? "text-red-600" : "text-gray-700"}`}>{status}</p>}

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
                            <VideoDownloader 
                                videoUrl={downloadUrl} 
                                fileName="miceband_video.mp4" 
                                bgColor="bg-gray" 
                                hoverBgColor="bg-slate-900" 
                                textColor="text-white"
                                textContent="Download Video"
                            />
                            <VideoDownloader 
                                videoUrl={downloadUrl} 
                                fileName="miceband_video.mp4" 
                                bgColor="bg-[#23E7E0]" 
                                hoverBgColor="bg-[#64fffa]" 
                                redirectUrl="https://www.tiktok.com/login?lang=en&redirect_url=https%3A%2F%2Fwww.tiktok.com%2Fupload" 
                                textColor="text-black"
                                icon={<TikTokIcon />}
                                textContent="Share To TikTok"
                            />
                        </div>
                    )}
                    <Feed />
                </div>
            </div>
            
        </div>
    );
}

export default VideoGenerator;
