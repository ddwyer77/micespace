const axios = require("axios");

exports.handler = async (event) => {
  try {
    const { model, prompt, first_frame_image } = JSON.parse(event.body);
    const apiKeyMiniMaxi = process.env.VITE_API_KEY_MINIMAXI;

    const response = await axios.post(
      "https://api.minimaxi.chat/v1/video_generation",
      {
        model,
        prompt,
        first_frame_image,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKeyMiniMaxi}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { task_id } = response.data;

    return {
      statusCode: 202,
      body: JSON.stringify({ task_id }),
    };
  } catch (error) {
    console.error("Error generating video:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};