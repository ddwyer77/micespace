import React, { useState } from "react";
import axios from "axios";

function VideoGenerator() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const apiKey = import.meta.env.VITE_REACT_APP_API_KEY; 
  const model = "video-01";

  const handleGenerateVideo = async () => {
    setLoading(true);
    setStatus("");
    setDownloadUrl("");

    try {
      const createTaskResponse = await axios.post(
        "https://api.minimaxi.chat/v1/video_generation",
        {
          model,
          first_frame_image: imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { task_id } = createTaskResponse.data;
      setStatus("Task submitted. Waiting for processing...");

      // Step 2: Poll Task Status
      let taskStatus = "Queueing";
      let fileId = "";

      while (taskStatus === "Queueing" || taskStatus === "Processing") {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        const queryResponse = await axios.get(
          `https://api.minimaxi.chat/v1/query/video_generation?task_id=${task_id}`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          }
        );

        const { status, file_id } = queryResponse.data;
        taskStatus = status;

        if (status === "Success") {
          fileId = file_id;
          break;
        } else if (status === "Fail") {
          setStatus("Video generation failed.");
          setLoading(false);
          return;
        }
      }

      // Step 3: Fetch Video Download URL
      const fetchResponse = await axios.get(
        `https://api.minimaxi.chat/v1/files/retrieve?file_id=${fileId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      const { download_url } = fetchResponse.data.file;
      setDownloadUrl(download_url);
      setStatus("Video generation successful! Download your video below.");
    } catch (error) {
      setStatus("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
        <div>
            <label htmlFor="username" className="block text-sm text-gray-500 dark:text-gray-300">Image Url</label>
            <input  type="url" 
                placeholder="Enter Image Url" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)} className="block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40" 
            />
        </div>
      <button
        onClick={handleGenerateVideo}
        disabled={loading || !imageUrl}
        className="bg-primary text-white py-4 hover:bg-primary-dark rounded-lg"
        style={{
          background: loading ? "gray" : "primary",
          cursor: loading ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {loading ? "Processing..." : "Generate Video"}
      </button>

      {loading && 
        <div>   
            <div role="status">
                <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span class="sr-only">Loading...</span>
            </div>
            <p style={{ marginTop: "20px" }}>Please wait...</p>
        </div>
    }

      {status && <p style={{ marginTop: "20px" }}>{status}</p>}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          style={{
            marginTop: "10px",
            display: "inline-block",
            padding: "10px 20px",
            background: "green",
            color: "white",
            textDecoration: "none",
          }}
        >
          Download Video
        </a>
      )}
    </div>
  );
}

export default VideoGenerator;
