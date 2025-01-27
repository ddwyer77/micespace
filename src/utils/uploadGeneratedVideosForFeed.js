import { uploadFile, getFileUrl } from "../utils/storage.js";
import axios from "axios";

const uploadGeneratedVideosForFeed = async (videoUrl, storagePath) => {
    try {
        const response = await axios.get(videoUrl, { responseType: "blob" });
        const videoBlob = response.data;

        // Use uploadFile directly from utils
        const downloadUrl = await uploadFile(videoBlob, storagePath);
        console.log("Video uploaded successfully. URL:", downloadUrl);
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading video from URL:", error);
        throw error;
    }
};

export default uploadGeneratedVideosForFeed;
