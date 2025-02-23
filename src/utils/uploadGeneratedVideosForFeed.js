import { uploadFile } from "../utils/storage.js";
import axios from "axios";

const uploadGeneratedVideosForFeed = async (videoSource, storagePath) => {
    try {
        let videoBlob;

        if (typeof videoSource === "string") {
            // If it's a URL, fetch the Blob
            console.log("Fetching video from URL...");
            const response = await axios.get(videoSource, { responseType: "blob" });
            videoBlob = response.data;
        } else if (videoSource instanceof Blob) {
            // If it's already a Blob, use it directly
            console.log("Uploading provided Blob...");
            videoBlob = videoSource;
        } else {
            throw new Error("Invalid video source. Must be a URL or Blob.");
        }

        // Upload the file
        const downloadUrl = await uploadFile(videoBlob, storagePath);
        console.log("✅ Video uploaded successfully:", downloadUrl);
        return downloadUrl;
    } catch (error) {
        console.error("❌ Error uploading video:", error);
        throw error;
    }
};

export default uploadGeneratedVideosForFeed;
