const axios = require("axios");

exports.handler = async (event) => {
  try {
    // Fetch Shotstack API Key from environment variables
    const shotstackApiKey = process.env.VITE_API_KEY_SHOTSTACK;
    if (!shotstackApiKey) {
      throw new Error("Missing Shotstack API key in environment variables.");
    }
 
    const { videoUrls, audioUrl, clipLength, audioLength, maxPollingTime = 300000 } = JSON.parse(event.body);

    if (!videoUrls || videoUrls.length === 0 || !audioUrl || !clipLength || !audioLength) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid input. Ensure videoUrls (array of 2), audioUrl, and clipLength are provided.",
        }),
      };
    }

    const videoClips = videoUrls.map((url, index) => ({
      asset: {
        type: "video",
        src: url,
      },
      start: index * clipLength, 
      length: clipLength,
    }));
  
    const tracks = [
      {
        clips: videoClips,
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
            length: audioLength,
          },
        ],
      },
    ];

    const requestBody = {
      timeline: { tracks },
      output: { format: "mp4", size: { width: 720, height: 1280 } },
    };

    // Start render
    const renderResponse = await axios.post("https://api.shotstack.io/v1/render", requestBody, {
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
    });

    const renderId = renderResponse.data.response.id;
    console.log("Render started with ID:", renderId);

    // Poll for render status
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
            "x-api-key": shotstackApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      status = statusResponse.data.response.status;

      if (status === "done") {
        const renderUrl = statusResponse.data.response.url;
        console.log("Video rendering completed:", renderUrl);
        return {
          statusCode: 200,
          body: JSON.stringify({ renderUrl }),
        };
      } else if (status === "failed") {
        throw new Error("Video rendering failed.");
      }

      console.log(`Render status: ${status}`);
    }
  } catch (error) {
    console.error("Error in mergeVideos function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
