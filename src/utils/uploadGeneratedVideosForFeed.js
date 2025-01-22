import { getFileUrl, uploadFile } from "../utils/storage.js";
import axios from "axios";

/**
 * Saves a video from a URL to Firebase Storage.
 * @param {string} url - The URL of the video to save.
 */
const uploadGeneratedVideosForFeed = async (url) => {
    try {
        // Step 1: Download the video file as a Blob
        const response = await axios.get(url, { responseType: "blob" });
        const fileBlob = response.data;

        // Step 2: Generate a meaningful name for the file
        let fileName;

        // Option 1: Extract name from the URL
        const urlParts = url.split("/");
        fileName = urlParts[urlParts.length - 1] || `video-${Date.now()}.mp4`;

        // Option 2 (Fallback): Use a timestamp if the URL doesn't have a meaningful name
        if (!fileName.includes(".")) {
            fileName = `video-${Date.now()}.mp4`; // Ensure the file has an extension
        }

        // Step 3: Upload the Blob to Firebase Storage
        const storagePath = `generatedVideos/${fileName}`;
        const firebaseUrl = await uploadFile(fileBlob, storagePath);

        console.log("Video saved to Firebase Storage:", firebaseUrl);
    } catch (error) {
        console.error("Error saving video to Firebase Storage:", error);
    }
};

export default uploadGeneratedVideosForFeed;
