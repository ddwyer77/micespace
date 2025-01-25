// const axios = require("axios");

// exports.handler = async (event) => {
//   try {
//     const minimaxiApiKey = process.env.VITE_API_KEY_MINIMAXI;

//     if (!minimaxiApiKey) {
//       throw new Error("Missing MiniMaxi API key in environment variables.");
//     }

//     const { model, prompt, first_frame_image } = JSON.parse(event.body);

//     if (!model || !prompt || !first_frame_image) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           error: "Missing required parameters: model, prompt, or first_frame_image.",
//         }),
//       };
//     }

//     // Step 1: Create the MiniMaxi Task
//     const createTaskResponse = await axios.post(
//       "https://api.minimaxi.chat/v1/video_generation",
//       { model, prompt, first_frame_image },
//       {
//         headers: {
//           Authorization: `Bearer ${minimaxiApiKey}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const { task_id } = createTaskResponse.data;

//     if (!task_id) {
//       throw new Error("Failed to create MiniMaxi task. No task_id returned.");
//     }

//     console.log(`Task created successfully with task_id: ${task_id}`);

//     // Step 2: Poll for Task Status
//     let taskStatus = "Queueing";
//     let generatedVideoUrl = null;
//     const maxPollingTime = 10 * 60 * 1000; // 10 minutes
//     const startTime = Date.now();

//     while (["Queueing", "Processing", "Preparing"].includes(taskStatus)) {
//       if (Date.now() - startTime > maxPollingTime) {
//         throw new Error("Polling timed out.");
//       }

//       // Wait before polling again
//       await new Promise((resolve) => setTimeout(resolve, 15000)); // Poll every 15 seconds

//       const queryResponse = await axios.get(
//         `https://api.minimaxi.chat/v1/query/video_generation?task_id=${task_id}`,
//         {
//           headers: { Authorization: `Bearer ${minimaxiApiKey}` },
//         }
//       );

//       taskStatus = queryResponse.data.status;

//       console.log(`Task status: ${taskStatus}`);

//       if (taskStatus === "Success") {
//         const { file_id } = queryResponse.data;

//         // Step 3: Retrieve the Generated Video URL
//         const fetchResponse = await axios.get(
//           `https://api.minimaxi.chat/v1/files/retrieve?file_id=${file_id}`,
//           {
//             headers: { Authorization: `Bearer ${minimaxiApiKey}` },
//           }
//         );

//         generatedVideoUrl = fetchResponse.data.file.download_url;
//         break;
//       } else if (taskStatus === "Fail") {
//         throw new Error("MiniMaxi video generation failed.");
//       }
//     }

//     if (!generatedVideoUrl) {
//       throw new Error("Failed to retrieve MiniMaxi-generated video.");
//     }

//     console.log(`Generated video URL: ${generatedVideoUrl}`);

//     // Return the generated video URL to the frontend
//     return {
//       statusCode: 200,
//       body: JSON.stringify({ generatedVideoUrl }),
//     };
//   } catch (error) {
//     console.error("Error in Netlify background function:", error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: error.message }),
//     };
//   }
// };

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