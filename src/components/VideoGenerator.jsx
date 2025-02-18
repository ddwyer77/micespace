import React, { useState, useEffect } from "react";
import axios from "axios";
import loadingMessages from "../utils/loadingMessages.js";
import { getFileUrl, uploadFile, deleteFile, addDocument } from "../utils/storage.js";
import uploadGeneratedVideosForFeed from "../utils/uploadGeneratedVideosForFeed.js";
import logoSlogan from '../assets/images/logo_slogan.png';
import MarvinCheese from '../assets/images/marvin_cheese.jpeg';
import TuffestBear from '../assets/images/tuffest_bear.jpeg';
import MiceBandOriginal from '../assets/images/mice_band_original.jpeg';
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
    const [ originalVidUrl, setOriginalVidUrl ] = useState("");
    const [ loading, setLoading ] = useState(false);
    const [ uploading, setUploading ] = useState(false);
    const [ status, setStatus ] = useState("");
    const [ downloadUrl, setDownloadUrl ] = useState("");
    const [ loadingMessageIndex, setLoadingMessageIndex ] = useState(0);
    const [ progress, setProgress ] = useState(0);
    const [ isRedirectError, setIsRedirectError ] = useState(false);
    const audioUrlMiceBandOriginal = "https://firebasestorage.googleapis.com/v0/b/mice-band.firebasestorage.app/o/audio%2FMicebandoglink.m4a?alt=media&token=3350faaf-1949-432f-aaeb-64d27af57d5e";
    const audioUrlMarvinCheese = "https://firebasestorage.googleapis.com/v0/b/mice-band.firebasestorage.app/o/audio%2Fthe%20moon%20is%20hollow%20snippet.mp3?alt=media&token=735a7bac-af09-4aca-8fdf-1c08a3c0bb6c";
    const audioUrlTuffestBear = "https://firebasestorage.googleapis.com/v0/b/mice-band.firebasestorage.app/o/audio%2Fdavidthetragic%20new%20body%20snippet.mp3?alt=media&token=8e14a1fc-59b3-41c7-97b2-b3f245a8262d";
    const promptMiceBandOriginal = "The Camera smoothly pans without delay over and down and there is a band of realistic mice rocking out and jamming and playing drums and guitar.";
    const promptMarvinCheese = "The camera pans over and there is a mouse man in an orange jumpsuit sitting on a stool and playing an acoustic guitar and singing.";
    const promptTuffestBear = "Camera zooms out and a cool rapper bear comes into the frame. He is wearing a flat bill hat and a obnoxious amount of rapper jewelry (big diamond chains and many diamond watches and big rings with diamonds on his fingers) he puts his hand on his shoulder and starts rapping.";
    const promptSecondTuffestBear = "A cool rapper bear is rapping with a lot of enthusiasm jumping up and down and really giving it his all.";
    const generationTypes = ["mice_band_original", "marvin_cheese", "tuffest_bear"];
    const [ generationData, setGenerationData ] = useState({
        audioUrl: audioUrlMiceBandOriginal,
        prompt: promptMiceBandOriginal,
        generationType: "mice_band_original"
    });
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
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages[generationData.generationType].length);
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
        const sanitizedFileName = file.name.replace(/\s+/g, "_");
        const fileExtension = getFileExtension(file.name); 
    
        try {
            // Upload to Firebase
            handleUpdateStatus("Uploading original video...", 0);
            const uploadedUrl = await uploadFile(file, `videos/${sanitizedFileName}`);
            console.log("Uploaded Video:", uploadedUrl);
            setOriginalVidUrl(uploadedUrl); 
    
            // Compress the uploaded video
            handleUpdateStatus("Compressing video...", 0);
            const response = await axios.post("/.netlify/functions/compressVideo", { videoUrl: uploadedUrl, type: fileExtension });
            console.log("Compression Response:", response.data.data.id);
            setIngestedVideoId(response.data.data.id);
    
            handleUpdateStatus("Video uploaded.", 0);
            setUploading(false);
        } catch (error) {
            console.error("Error uploading video:", error);
            handleCriticalError("Failed to upload video.");
            setUploading(false);
        }
    };
      
    const getFileExtension = (filename) => {
        console.log("Extracting file extension for:", filename);
        const match = filename.match(/\.([a-zA-Z0-9]+)$/);
        return match ? match[1].toLowerCase() : '';
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

    const handleSelectContent = (audioUrl, prompt, generationType) => {
        setGenerationData((prevData) => ({
            ...prevData,
            audioUrl: audioUrl,
            prompt: prompt,
            generationType: generationType
        }));
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

    async function mergeVideos(trimmedVideoUrl, task_id) {
        setIsMerging(true);
        const generatedVideoUrl = await pollTaskStatus(task_id);
        console.log("Generated Video URL:", generatedVideoUrl);
    
        // Proceed to merge the videos
        let videoUrls = [trimmedVideoUrl, generatedVideoUrl];
        let audioLength = 5;

        // TODO - Check alternative prompt works
        // TODO - breakpoint at generatedVideoUrls and make sure they are correct

        if (generationData.generationType === "tuffest_bear") {
            const generatedVideoUrls = await getDoubleVideoGeneration(generatedVideoUrl);
            videoUrls = [trimmedVideoUrl, ...generatedVideoUrls];
            audioLength = 10;
        }

        const mergeResponse = await axios.post("/.netlify/functions/mergeVideos", {
            videoUrls,
            audioUrl: generationData.audioUrl,
            clipLength,
            audioLength: audioLength
        });
    
        const mergedVideoUrl = mergeResponse.data.renderUrl;
        console.log("Merged Video URL:", mergedVideoUrl);
    
        setDownloadUrl(mergedVideoUrl);
        await uploadAndSaveVideo(mergedVideoUrl)
        handleUpdateStatus("Video generated successfully.", 100);
        localStorage.removeItem("currentVideoInProgress");
        setIsMerging(false);
    }

    async function uploadAndSaveVideo(mergedVideoUrl) {
        const storagePath = `generatedVideosUnapproved/video-${Date.now()}.mp4`;
        const videoTitle = storagePath.split('/').pop().split('.')[0];
    
        try {
            // 1️⃣ Upload video and get the download URL
            const downloadUrl = await uploadGeneratedVideosForFeed(mergedVideoUrl, storagePath);
            console.log("✅ Video uploaded to Firebase:", downloadUrl);
    
            // 2️⃣ Save video metadata to database
            const newDocId = await addDocument("videos", downloadUrl, videoTitle, generationData.generationType);
            console.log("✅ New item added:", newDocId);
    
            return downloadUrl; // Return for further use if needed
        } catch (err) {
            console.error("❌ Error uploading or saving video:", err);
            throw err; // Propagate error if necessary
        }
    }

    async function getIngestedVideoUrl(ingestedVideoId) {
        try {
            const ingestedVideoUrl = await pollIngestedVideo(ingestedVideoId);
            if (!ingestedVideoUrl) {
                throw new Error("Failed to retrieve ingested video URL.");
            }
            console.log("Ingested Video Url:", ingestedVideoUrl);
            return ingestedVideoUrl;
        } catch (error) {
            console.error("Error getting ingested video:", error.message);
            handleCriticalError("Failed to get ingested video URL.");
            throw error;
        }
    }
    

    async function getLastFrame(trimmedVideoUrl) {
        try {
            const response = await axios.post("/.netlify/functions/getLastFrame", {
                trimmedVideoUrl,
                clipLength,
            });
            const lastFrameDataUrl = response.data.renderUrl;
            console.log("Last Frame:", lastFrameDataUrl);
            return lastFrameDataUrl;
        } catch (error) {
            console.error("Error fetching last frame:", error);
            handleCriticalError("Failed to fetch last frame.");
            throw error;
        }
    }

    async function trimVideo(ingestedVideoUrl) {
        try {
            handleUpdateStatus("Trimming video...", 20);
            const response = await axios.post("/.netlify/functions/trimVideo", {
              videoUrl: ingestedVideoUrl,
              clipLength
            });
            const trimmedVideoUrl = response.data.trimmedVideoUrl;
            console.log("Trimmed Video:", trimmedVideoUrl);
            return trimmedVideoUrl;
        } catch (error) {
            console.error(error);
            handleCriticalError("Failed to trim video.");
            return;
        }
    }

    async function getAiGeneratedVideoTaskId(lastFrameDataUrl, alternatePrompt = null) {
        const prompt = alternatePrompt ? alternatePrompt : generationData.prompt;
        try {
            const response = await axios.post("/.netlify/functions/generateMiniMaxiVideo", {
                model: "video-01",
                prompt: prompt,
                first_frame_image: lastFrameDataUrl,
            });
            return response.data;
        } catch (error) {
            console.error(error);
            handleCriticalError("Failed create AI generation task.");
            return;
        }

    }

    async function getDoubleVideoGeneration(firstGeneratedVideo) {
        const lastFrame = await getLastFrame(firstGeneratedVideo);
        handleUpdateStatus("Finishing up ai video generation...", 55);
        const aiGeneratedVideoTaskId = await getAiGeneratedVideoTaskId(lastFrame, promptSecondTuffestBear);
        const secondGeneratedVideo = await pollTaskStatus(aiGeneratedVideoTaskId.task_id);
        const videoUrls = [firstGeneratedVideo, secondGeneratedVideo];
        // add second prompt to new ai generation
        return videoUrls;
    }

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
            // ********************************************
            // *     Get Ingested Video
            // ********************************************
            const ingestedVideoUrl = await getIngestedVideoUrl(ingestedVideoId);

            // ********************************************
            // *     Trim Video To 5 Seconds
            // ********************************************
            const trimmedVideoUrl = await trimVideo(ingestedVideoUrl);

            // ********************************************
            // *     Get Last Frame
            // ********************************************
            const lastFrame = await getLastFrame(trimmedVideoUrl);
                        
            // ********************************************
            // *     Send Request to MiniMaxi 
            // ********************************************
            handleUpdateStatus("Generating Video...", 40);
            const aiGeneratedVideoTaskId = await getAiGeneratedVideoTaskId(lastFrame);


            // ********************************************
            // *     Save Task In Case Of Refresh
            // ********************************************
            const { task_id } = aiGeneratedVideoTaskId;
            localStorage.setItem("currentVideoInProgress", JSON.stringify({"task_id": task_id, "trimmed_video_url": trimmedVideoUrl}));
            toast.success("Your video is still generating. Progress saved. Please continue to wait...");
            console.log("Task ID:", task_id);

            try {
                await mergeVideos(trimmedVideoUrl, task_id);
            } catch (error) {
                console.error("❌ Error during video merge:", error);
                handleCriticalError("Failed to merge video.");
                throw error;
            }

        } catch (error) {
            console.error("Error generating video:", error.message);
            handleCriticalError("Failed to generate video.");
            document.write("Error generating video:", error.message);
        } finally {
            setLoading(false);

            // ********************************************
            // *     Delete Original Video
            // ********************************************
            try {
                if (originalVidUrl) {
                    const filePath = decodeURIComponent(originalVidUrl.split("/o/")[1].split("?")[0]);
                    await deleteFile(filePath);
                    console.log("Original video deleted from Firebase.");
                } else {
                    console.log("No original video URL available to delete.");
                }
            } catch (error) {
                console.error("Error deleting video from Firebase:", error.message);
            }
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
                        <div className="flex gap-4">
                        <Card 
                            onClick={() => handleSelectContent(audioUrlMiceBandOriginal, promptMiceBandOriginal, generationTypes[0])} 
                            imageUrl={MiceBandOriginal} 
                            name="Mice Band Original" 
                            isSelected={generationData.generationType === generationTypes[0]} 
                            loading={loading}
                        />

                        <Card 
                            onClick={() => handleSelectContent(audioUrlMarvinCheese, promptMarvinCheese, generationTypes[1])} 
                            imageUrl={MarvinCheese} 
                            name="Marvin Cheese" 
                            isSelected={generationData.generationType === generationTypes[1]} 
                            loading={loading}
                        />

                        <Card 
                            onClick={() => handleSelectContent(audioUrlTuffestBear, promptTuffestBear, generationTypes[2])} 
                            imageUrl={TuffestBear} 
                            name="Tuffest Bear" 
                            isSelected={generationData.generationType === generationTypes[2]} 
                            loading={loading}
                        />
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
                            <p>{loadingMessages[generationData.generationType][loadingMessageIndex]}</p>
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
