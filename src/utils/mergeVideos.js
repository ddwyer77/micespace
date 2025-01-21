import axios from "axios";

const mergeVideos = async (videoUrls, apiKeyShotStack, maxPollingTime = 300000) => {
    try {
      const clips = videoUrls.map((url, index) => ({
        asset: { type: "video", src: url },
        start: index === 0 ? 0 : `auto`,
        length: "auto",
      }));
  
      const requestBody = {
        timeline: {
          tracks: [{ clips }],
        },
        output: { format: "mp4", size: { width: 1280, height: 720 } },
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
  