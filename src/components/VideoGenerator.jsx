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
    const [ loading, setLoading ] = useState(false);
    const [ uploading, setUploading ] = useState(false);
    const [ status, setStatus ] = useState("");
    const [ downloadUrl, setDownloadUrl ] = useState("");
    const [ previewUrl, setPreviewUrl ] = useState("");
    const [ loadingMessageIndex, setLoadingMessageIndex ] = useState(0);
    const [ progress, setProgress ] = useState(0);
    const [ campaigns, setCampaigns ] = useState([]);
    const [ currentCampaign, setCurrentCampaign ] = useState(0);
    const [ generationData, setGenerationData ] = useState(null);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [videoToPreview, setVideoToPreview] = useState("");
    const [ hasAcceptedTerms, setHasAcceptedTerms ] = useState(false);
    const [ showError, setShowError ] = useState(false);
    const [ isProcessingVideo, setIsProcessingVideo ] = useState(false);
    const [ email, setEmail ] = useState("");
    const [ isValidEmail, setIsValidEmail ] = useState(false);
    const [ isAuthenticated, setIsAuthenticated ] = useState(false);
    const isLocal = import.meta.env.VITE_NODE_ENV === "development" || !import.meta.env.VITE_API_BASE_URL;
    const baseUrl = isLocal ? "http://localhost:5000" : import.meta.env.VITE_API_BASE_URL;
    const clipLength = 5;

    useEffect(() => {     
        if (!loading) return;
        const interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % generationData.loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        fetchCampaigns();
    }, [])

    useEffect(() => {
        const storedEmail = localStorage.getItem("email");
        if (storedEmail) {
            setEmail(storedEmail);
            setIsValidEmail(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storedEmail));
        }
    }, []);

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

    const getVideoProcessProgress = () => {
        const duration = 500;
        const intervalTime = 1000; // 1 second
        const increment = 100 / duration; // Increment per second
    
        setProgress(0); // Reset progress
    
        const interval = setInterval(() => {
            setProgress((prevProgress) => {
                const newProgress = prevProgress + increment;
                if (newProgress >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return newProgress;
            });
        }, intervalTime);
    };

    const fetchCampaigns = async () => {
        try {
            const campaigns = await getCollectionDocs("campaigns");
            const sortedCampaigns = campaigns.sort((a, b) => a.sort - b.sort);
            setCampaigns(sortedCampaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    }

    const handleVideoUpload = async (event) => {
        setUploading(true);
        const file = event.target.files[0];
    
        if (!file) {
            console.error("No file selected");
            setUploading(false);
            return;
        }
    
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 80) {
            console.error("File is larger than 80 MB");
            handleCriticalError("*File must be 80 MB or smaller.");
            setUploading(false);
            return;
        }
    
        setVideoFile(file); // Store the selected video file
        setStatus("Video uploaded successfully.");
        setUploading(false);
    };

    const processVideo = async () => {
        if (!videoFile) {
            alert("Please select a video file.");
            return;
        }

        const currentEmail = (email && isValidEmail && email != "") ? email : null;
    
        setIsProcessingVideo(true);
        setProgress(0);
        getVideoProcessProgress();
        setLoading(true);
        setDownloadUrl("");
    
        const formData = new FormData();
        formData.append("originalVideo", videoFile);
        formData.append("prompt", generationData.prompt);
        formData.append("clipLength", clipLength);
        formData.append("audioUrl", generationData.audioUrl);
        formData.append("generationType", generationData.generationType);
        formData.append("email", email);
    
        try {
            const response = await axios.post(`${baseUrl}/api/get-task-id`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
    
            let { task_id, trimmed_video } = response.data;

            if (task_id) {
                localStorage.setItem("task_id", task_id);
            }

            //TODO: swap before merge
            // task_id = '241528415490229';
            await waitBeforePolling();

            const file_id = await pollMiniMaxForVideo(task_id);
            console.log("🎥 AI-generated video File ID:", file_id);
    
            formData.append("aiVideoFileId", file_id);
            formData.append("trimmedVideo", trimmed_video);

            // Step 3: Wait for the final processed video 
            const finalVideoResponse = await axios.post(
                `${baseUrl}/api/complete-video`,
                JSON.stringify({
                    aiVideoFileId: file_id,
                    trimmedVideo: trimmed_video,
                    audioUrl: generationData.audioUrl,
                    doubleGeneration: generationData.doubleGeneration,
                    clipLength,
                    generationType: generationData.generationType,
                    email: currentEmail
                }),
                {
                    headers: { "Content-Type": "application/json" },
                    responseType: "json"
                }
            );
  
            setDownloadUrl(finalVideoResponse.data.videoUrl);
            console.log("✅ Final video ready:", finalVideoResponse.data.videoUrl);

            setPreviewUrl(finalVideoResponse.data.videoUrl);
    
        } catch (error) {
            console.error("❌ Error processing video:", error);
            setIsProcessingVideo(false);
        } finally {
            setLoading(false);
            setIsProcessingVideo(false);
        }
    };

    const waitBeforePolling = () => {
        return new Promise(resolve => {
            console.log("⏳ Waiting for AI Generation...");
            let messages = [
                "⏳ Waiting: Holding for AI magic...",
                "✨ Waiting: Creating AI-powered video...",
                "🔄 Waiting: Processing, hang tight...",
                "🚀 Waiting: AI is working hard on this...",
                "🎬 Waiting: Finalizing the masterpiece...",
                "🤖 Waiting: Bringing AI visuals to life...",
                "📽️ Waiting: Almost there, just a little longer..."
            ];

            let attempt = 0;
            const interval = setInterval(() => {
                console.log(messages[attempt % messages.length]); // Cycle through messages
                attempt++;
            }, 30000);

            setTimeout(() => {
                clearInterval(interval);
                console.log("✅ Starting polling...");
                resolve();
            }, 180000); // 180000ms = 3 minutes
        });
    };

    const pollMiniMaxForVideo = async (taskId) => {
        const pollInterval = 15000; // 15 seconds
        const maxRetries = 10; // 🔹 Max attempts before erroring out
        let attempts = 0;
    
        console.log(`⏳ Starting polling for AI video with Task ID: ${taskId}`);
    
        while (attempts < maxRetries) {
            try {
                const response = await fetch("/.netlify/functions/poll-ai-video", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId }),
                });
    
                const data = await response.json();
    
                if (data.status === "Success") {
                    console.log("✅ AI Video Ready:", data.file_id);
                    return data.file_id; // Return file_id when done
                }
    
                console.log(`⏳ Video still processing... Attempt ${attempts + 1} of ${maxRetries}`);
            } catch (error) {
                console.error("❌ Error polling MiniMax:", error);
            }
    
            attempts++;
            if (attempts >= maxRetries) {
                console.error("❌ Maximum polling attempts reached. AI Video not ready.");
                throw new Error("AI video processing timed out after 10 attempts.");
            }
    
            await new Promise(res => setTimeout(res, pollInterval));
        }
    };

    const handleEnterEmail = (event) => {
        const emailValue = event.target.value;
        setEmail(emailValue);
    
        // Regular expression for basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
        if (emailValue === "" || emailRegex.test(emailValue)) {
            setIsValidEmail(true);
            localStorage.setItem("email", emailValue);
            localStorage.setItem("emailValid", true);
        } else {
            setIsValidEmail(false);
            console.error("Invalid email address");
        }
    };

    const handleUpdateStatus = (message) =>{
        setMessageIsCritial(false);
        setStatus(message);
    }

    const handleCriticalError = (message) => {
        setMessageIsCritial(true);
        setStatus(message);
        setLoading(false);
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

    const handleOpenVideoModal = (videoUrl) => {
        setVideoToPreview(videoUrl);
        setIsVideoModalOpen(true);
    };

    const handleGenerateVideo = async () => {
        if (!videoFile) {
            handleUpdateStatus("Please upload a video file.");
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

        // if (!isValidEmail && email != "") {
        //     handleUpdateStatus("Please enter a valid email.");
        //     toast.error("Please enter a valid email.");
        //     return;
        // }
        
        processVideo();
    };

    const handleShareToTikTok = async () => {
        if (!downloadUrl) {
            console.error("No video available to share.");
            return;
        }
   
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", "miceband_video.mp4");
        document.body.appendChild(link);
    
        link.click();
 
        document.body.removeChild(link);
    
        setTimeout(() => {
            window.location.href = "https://www.tiktok.com/login?lang=en&redirect_url=https%3A%2F%2Fwww.tiktok.com%2Fupload";
        }, 2000); 
    };

    return (
        <div className="flex justify-center items-center flex-col p-4 mt-24 relative">
            <div className="max-w-2xl flex flex-col gap-4">
                <div className="flex flex-col gap-4 justify-center items-center md:min-w-[600px]">
                    <img src={logoSlogan} alt="micespace logo"/>
                    {/* ***** Email ***** */}
                    {/* <div className="w-full">
                        <h3 className="text-2xl font-bold w-full text-start">Email (Optional)</h3>
                        <p className="text-gray-700 w-full">We'll send you a link to download your video.</p>
                        {!isValidEmail && email != "" && <p className="text-red-600 font-bold">*Please enter a valid email.</p>}
                        <input type="email" value={email} placeholder="Email" className="block w-full border rounded-lg p-2 h-12" onChange={handleEnterEmail} />
                    </div> */}
       

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
                            {isProcessingVideo && (
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div
                                    className="bg-primary h-4 rounded-full"
                                    style={{ width: `${progress}%` }}
                                    ></div>
                                </div>  
                            )}
                            <p>{generationData.loadingMessages[loadingMessageIndex]}</p>
                        </div>
                    )}

                    {loading && (<p className="mt-4 text-gray-700">Your video is being processed. This could take up to 5 minutes. <span className="font-bold italic text-red-600">**Please don't close the page.</span></p>)}
                    {status && <p className={`mt-4 ${messageIsCritial ? "text-red-600" : "text-gray-700"}`}>{status}</p>}

                    {downloadUrl && previewUrl && (
                        <div className="w-full flex flex-col gap-4">
                            <a
                                onClick={() => handleOpenVideoModal(previewUrl)}
                                target="_blank"
                                download
                                className="block bg-green-600 text-white hover:text-white hover:bg-green-700 px-4 rounded-lg w-full text-center py-4"
                                >
                                View Video
                            </a>
                            <a
                                href={downloadUrl}
                                target="_blank"
                                download
                                className="block bg-slate-900 text-white hover:text-white hover:bg-slate-900 px-4 rounded-lg w-full text-center py-4"
                                >
                                Download Video
                            </a>
                            <button
                                onClick={handleShareToTikTok}
                                className="flex justify-center items-center bg-[#23E7E0] text-white hover:text-white hover:bg-[#64fffa] px-4 rounded-lg w-full text-center py-4"
                            >
                            {<TikTokIcon />} Share To TikTok
                            </button>
                        </div>
                    )}

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

                    {/* ***** Video Modal ***** */}
                    <Modal
                        isOpen={isVideoModalOpen}
                        onClose={() => setIsVideoModalOpen(false)}
                    >
                        <h3 className="text-2xl font-bold mb-4">Preview Video</h3>
                        <video controls className="w-full max-h-[600px] rounded-lg">
                            <source src={videoToPreview} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={() => setIsVideoModalOpen(false)} 
                                className="bg-gray-500 text-white px-4 py-2 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </Modal>

                    <Feed />
                </div>
            </div>
        </div>
    );
}

export default VideoGenerator;
