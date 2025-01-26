const axios = require("axios");

exports.handler = async (event) => {
  try {
    // Ensure the method is POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { videoUrl, type } = JSON.parse(event.body); // Extract video URL from request body

    if (!videoUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Video URL is required" }),
      };
    }

    const apiKey = process.env.VITE_API_KEY_SHOTSTACK; // Use environment variable for security
    const requestBody = {
      url: videoUrl, // The URL of your .mov file
      outputs: {
        renditions: [
          {
            format: type,
            quality: 50,
            fps: 24, 
            fit: "crop", 
            fixRotation: true, 
            fixOffset: true, 
            filename: "compressed-video", 
          },
        ],
      },
    };

    const response = await axios.post(
      "https://api.shotstack.io/ingest/v1/sources",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      }
    );

    const compressedVideoData = response.data;

    return {
      statusCode: 200,
      body: JSON.stringify(compressedVideoData),
    };
  } catch (error) {
    console.error("Error compressing video:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
