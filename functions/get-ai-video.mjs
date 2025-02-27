import axios from "axios";

const handler = async (event) => {
    try {
        // Check if file_id is passed correctly
        const file_id = event.httpMethod === "POST"
            ? JSON.parse(event.body).file_id
            : event.queryStringParameters.file_id;

        if (!file_id) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing file_id" }) };
        }

        const minimaxApiKey = process.env.VITE_API_KEY_MINIMAXI;
        console.log(`🚀 Fetching AI-generated video with File ID: ${file_id}`);

        // Call MiniMax API to get the AI-generated video
        const response = await axios.get(`https://api.minimaxi.chat/v1/files/retrieve?file_id=${file_id}`, {
            headers: { Authorization: `Bearer ${minimaxApiKey}` },
        });

        if (!response.data.file || !response.data.file.download_url) {
            console.error("❌ AI Video Not Found in response:", response.data);
            return { statusCode: 500, body: JSON.stringify({ error: "AI Video not found." }) };
        }

        const videoUrl = response.data.file.download_url;
        console.log("✅ AI Video Ready:", videoUrl);

        return { statusCode: 200, body: JSON.stringify({ videoUrl }) };

    } catch (error) {
        console.error("❌ Error retrieving AI video:", error.response ? error.response.data : error.message);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to retrieve AI video." }) };
    }
};

export { handler };
