const axios = require("axios");

exports.handler = async (event) => {
  try {
    const { task_id } = JSON.parse(event.body);
    const apiKeyMiniMaxi = process.env.VITE_API_KEY_MINIMAXI;

    const response = await axios.get(
      `https://api.minimaxi.chat/v1/query/video_generation?task_id=${task_id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKeyMiniMaxi}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { status, file_id } = response.data;

    if (status === "Success") {
      const fetchResponse = await axios.get(
        `https://api.minimaxi.chat/v1/files/retrieve?file_id=${file_id}`,
        {
          headers: { Authorization: `Bearer ${apiKeyMiniMaxi}` },
        }
      );
      const generatedVideoUrl = fetchResponse.data.file.download_url;
      return {
        statusCode: 200,
        body: JSON.stringify({ status, generatedVideoUrl }),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ status }),
      };
    }
  } catch (error) {
    console.error("Error checking task status:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};