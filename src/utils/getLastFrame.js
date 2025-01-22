/**
 * Extracts the last frame of a video as a PNG data URL.
 * @param {string} videoUrl - The URL of the video to process.
 * @returns {Promise<string>} - A promise that resolves to the PNG data URL of the last frame.
 */
const getLastFrame = async (videoUrl) => {
    return new Promise((resolve, reject) => {
        const videoElement = document.createElement("video");

        videoElement.crossOrigin = "anonymous"; // Enable CORS
        videoElement.src = videoUrl;
        videoElement.muted = true; // Mute the video to avoid audio issues

        videoElement.onloadedmetadata = () => {
            videoElement.currentTime = videoElement.duration; // Seek to the last frame
        };

        videoElement.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL("image/png")); // Return the PNG data URL
        };

        videoElement.onerror = () => reject(new Error("Failed to process video."));
    });
};

export default getLastFrame;
