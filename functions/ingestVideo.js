const axios = require("axios");

exports.handler = async (event) => {
  try {
    const { videoUrl } = JSON.parse(event.body);

    const shotstackKey = process.env.VITE_API_KEY_SHOTSTACK;
    if (!shotstackKey) {
      throw new Error("Missing SHOTSTACK_API_KEY environment variable");
    }

    // Define the request body for the Shotstack Ingest API
    const requestBody = {
      url: videoUrl,
      outputs: {
        renditions: [
          {
            format: "mp4",
            resolution: "hd",
            quality: 70,
            fit: "crop",
            fixRotation: true,
          },
        ],
      },
    };

    // Submit video for ingestion
    const response = await axios.post(
      "https://api.shotstack.io/ingest/v1/sources",
      requestBody,
      {
        headers: {
          "x-api-key": shotstackKey,
          "Content-Type": "application/json",
        },
      }
    );

    const { id: task_id } = response.data.data;

    return {
      statusCode: 202,
      body: JSON.stringify({ task_id }), // Return the task ID
    };
  } catch (error) {
    console.error("Error ingesting video:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message }),
    };
  }
};
