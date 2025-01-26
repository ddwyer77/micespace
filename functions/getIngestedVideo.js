const axios = require("axios");

exports.handler = async (event) => {
  try {
    // Video ID to fetch details
    const { videoId } = JSON.parse(event.body);

    // Check if the Shotstack API key is available
    const shotstackApiKey = process.env.VITE_API_KEY_SHOTSTACK;
    if (!shotstackApiKey) {
      throw new Error("Missing SHOTSTACK_API_KEY environment variable");
    }

    // Send GET request to retrieve the video details
    const response = await axios.get(
      `https://api.shotstack.io/ingest/v1/sources/${videoId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": shotstackApiKey,
        },
      }
    );

    // Extract video details from the response
    const videoDetails = response.data.data;

    return {
      statusCode: 200,
      body: JSON.stringify(videoDetails),
    };
  } catch (error) {
    console.error("Error fetching video details:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch video details.",
        details: error.response?.data || error.message,
      }),
    };
  }
};

