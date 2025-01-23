import axios from "axios";

const mergeVideos = async (videoUrls, apiKeyShotStack, audioUrl, clipLength, maxPollingTime = 300000) => {
    try {
        const tracks = [
            {
                clips: [
                    {
                        asset: {
                            type: "video",
                            src: videoUrls[0],
                        },
                        start: 0,
                        length: clipLength,
                        },
                        {
                        asset: {
                            type: "video",
                            src: videoUrls[1],
                        },
                        start: clipLength,
                        length: clipLength,
                    },
                ],
            },
            {
                clips: [
                    {
                        asset: {
                            type: "audio",
                            src: audioUrl,
                            trim: 0,
                            volume: 1,
                            speed: 1,
                        },
                        start: clipLength,
                        length: clipLength,
                    },
                ],
            },
        ];
          
  
        const requestBody = {
            timeline: {
                tracks,
            },
            output: { format: "mp4", size: { width: 720, height: 1280 } },
        };
    
        const renderResponse = await axios.post(
            "https://api.shotstack.io/v1/render",
            requestBody,
            {
            headers: {
                "x-api-key": apiKeyShotStack,
                "Content-Type": "application/json",
            },
            }
        );
    
        const renderId = renderResponse.data.response.id;
        console.log("Render started with ID:", renderId);
    
        const startTime = Date.now();
        let status = "queued";
    
        while (status !== "done") {
            if (Date.now() - startTime > maxPollingTime) {
            throw new Error("Render polling timed out.");
            }
    
            await new Promise((resolve) => setTimeout(resolve, 5000));
    
            const statusResponse = await axios.get(
            `https://api.shotstack.io/v1/render/${renderId}`,
            {
                headers: {
                "x-api-key": apiKeyShotStack,
                "Content-Type": "application/json",
                },
            }
            );
    
            status = statusResponse.data.response.status;
    
            if (status === "done") {
            const renderUrl = statusResponse.data.response.url;
            console.log("Video rendering completed:", renderUrl);
            return renderUrl;
            } else if (status === "failed") {
            throw new Error("Video rendering failed.");
            }
    
            console.log(`Render status: ${status}`);
        }
    } catch (error) {
        console.error("Error merging videos with Shotstack:", error);
        throw error;
    }
};
  
export default mergeVideos;
  