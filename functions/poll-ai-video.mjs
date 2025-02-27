import axios from "axios";

const handler = async (event) => {
    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: "No request body provided." }) };
        }

        const { taskId } = JSON.parse(event.body);
        if (!taskId) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing taskId" }) };
        }

        const minimaxApiKey = process.env.VITE_API_KEY_MINIMAXI; // Secure API key

        console.log(`🚀 Checking status for Task ID: ${taskId}`);

        // Query MiniMax for task status
        const response = await axios.get(`https://api.minimaxi.chat/v1/query/video_generation?task_id=${taskId}`, {
            headers: { Authorization: `Bearer ${minimaxApiKey}` }
        });

        const data = response.data;
        console.log("📡 MiniMax Response:", data);

        return { statusCode: 200, body: JSON.stringify(data) };

    } catch (error) {
        console.error("❌ Error querying AI video:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to query MiniMax video." }) };
    }
};

export { handler };
