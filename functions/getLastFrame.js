const axios = require("axios");

exports.handler = async (event) => {
  try {
    // Fetch Shotstack API Key from environment variables
    const shotstackApiKey = process.env.VITE_API_KEY_SHOTSTACK;
    if (!shotstackApiKey) {
      throw new Error("Missing Shotstack API key in environment variables.");
    }

    // Parse request body
    const { trimmedVideoUrl, clipLength = 5 } = JSON.parse(event.body);

    if (!trimmedVideoUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameter: trimmedVideoUrl" }),
      };
    }

    // Seek just before the end of the video
    const trimTime = Math.max(clipLength - 0.1, 0);

    const requestBody = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "video",
                  src: trimmedVideoUrl,
                  trim: trimTime,
                },
                start: 0,
                length: 1,
              },
            ],
          },
        ],
      },
      output: {
        format: "jpg",
        resolution: "hd",
        aspectRatio: "9:16",
      },
    };

    // 1) Send render request
    const renderResponse = await axios.post(
      "https://api.shotstack.io/edit/v1/render",
      requestBody,
      {
        headers: {
          "x-api-key": shotstackApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const renderId = renderResponse.data.response.id;

    // 2) Poll for status until done or failed
    let status = "queued";
    let renderUrl = null;

    while (status !== "done" && status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const statusRes = await axios.get(
        `https://api.shotstack.io/edit/v1/render/${renderId}`,
        {
          headers: {
            "x-api-key": shotstackApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      status = statusRes.data.response.status;
      renderUrl = statusRes.data.response.url || null;
    }

    if (status === "failed" || !renderUrl) {
      throw new Error("Shotstack snapshot render failed.");
    }

    // 3) Return the direct URL to the image
    return {
      statusCode: 200,
      body: JSON.stringify({ renderUrl }),
    };
  } catch (error) {
    console.error("Error in getLastFrame function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
