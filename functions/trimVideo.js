const axios = require("axios");

exports.handler = async (event) => {
  try {
    // 1) Fetch the secret key from Netlify environment variables
    const shotstackKey = process.env.VITE_API_KEY_SHOTSTACK; 
    if (!shotstackKey) {
      throw new Error("Missing SHOTSTACK_API_KEY environment variable");
    }

    const { videoUrl, clipLength, isVerticalVideo } = JSON.parse(event.body);
    const videoRotation = isVerticalVideo ? 90 : 0;
 
    const requestBody = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "video",
                  src: videoUrl,
                },
                start: 0,
                length: clipLength,
                transform: {
                  rotate: {
                    angle: videoRotation,
                  },
                },
                scale: 0.5,
              },
            ],
          },
        ],
      },
      output: {
        format: "mp4",
        resolution: "hd",
        aspectRatio: "9:16",
      },
    };

    // 3) Start render
    const renderResponse = await axios.post(
      "https://api.shotstack.io/stage/render",
      requestBody,
      {
        headers: {
          "x-api-key": shotstackKey,
          "Content-Type": "application/json",
        },
      }
    );
    const renderId = renderResponse.data.response.id;

    // 4) Poll until "done" or "failed"
    const maxPollingTime = 300000; // 5 minutes
    const startTime = Date.now();
    let status = "queued";

    while (status !== "done") {
      if (Date.now() - startTime > maxPollingTime) {
        throw new Error("Render polling timed out.");
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusRes = await axios.get(
        `https://api.shotstack.io/stage/render/${renderId}`,
        {
          headers: {
            "x-api-key": shotstackKey,
            "Content-Type": "application/json",
          },
        }
      );

      status = statusRes.data.response.status;
      if (status === "done") {
        const trimmedVideoUrl = statusRes.data.response.url;
        return {
          statusCode: 200,
          body: JSON.stringify({ trimmedVideoUrl }),
        };
      } else if (status === "failed") {
        throw new Error("Video trimming failed.");
      }
    }
  } catch (error) {
    console.error("Trim Video function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};