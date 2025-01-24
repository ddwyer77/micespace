import axios from "axios";

/**
 * Trims a video to 4 seconds using the Shotstack API.
 * @param {string} videoUrl - The URL of the video to trim.
 * @param {string} apiKey - The Shotstack API key.
 * @param {number} maxPollingTime - Maximum time to wait for render completion (in ms).
 * @returns {Promise<string>} - A promise that resolves with the URL of the trimmed video.
 */
const trimVideo = async (videoUrl, apiKey, clipLength, isVerticalVideo, maxPollingTime = 300000) => {
    const videoRotation = isVerticalVideo ? 90 : 0;
    try {
        // Step 1: Send the trim request to the API
        const requestBody = {
            timeline: {
                tracks: [
                    {
                        clips: [
                            {
                                asset: {
                                    type: "video",
                                    src: videoUrl, // Video URL to trim
                                },
                                start: 0, // Start from the beginning
                                length: clipLength,
                                transform: {
                                    rotate: {
                                        angle: videoRotation,
                                    }
                                },
                                scale: 0.5,
                            },
                        ],
                    },
                ],
            },
            output: {
                format: "mp4", // Output format
                resolution: "hd",
                aspectRatio: "9:16",
            },
        };

        const renderResponse = await axios.post(
            "https://api.shotstack.io/stage/render",
            requestBody,
            {
                headers: {
                    "x-api-key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        const renderId = renderResponse.data.response.id;
        console.log("Render started");

        // Step 2: Poll the API for render status
        const startTime = Date.now();
        let status = "queued";

        while (status !== "done") {
            if (Date.now() - startTime > maxPollingTime) {
                throw new Error("Render polling timed out.");
            }

            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds

            const statusResponse = await axios.get(
                `https://api.shotstack.io/stage/render/${renderId}`,
                {
                    headers: {
                        "x-api-key": apiKey,
                        "Content-Type": "application/json",
                    },
                }
            );

            status = statusResponse.data.response.status;

            if (status === "done") {
                const trimmedVideoUrl = statusResponse.data.response.url;
                console.log("Trimming completed. Video URL:", trimmedVideoUrl);
                return trimmedVideoUrl; // Return the URL of the trimmed video
            } else if (status === "failed") {
                throw new Error("Video trimming failed.");
            }

            console.log(`Render status: ${status}`);
        }
    } catch (error) {
        console.error("Error trimming video:", error);
        throw error;
    }
};

export default trimVideo;
