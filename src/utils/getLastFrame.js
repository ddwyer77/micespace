import axios from "axios";

/**
 * Extracts (or "snapshots") the last frame of a video using Shotstack, 
 * returning the direct URL to the rendered image on success.
 *
 * @param {string} videoUrl      - Publicly accessible URL of the source video.
 * @param {string} shotstackApiKey - Your Shotstack API key.
 * @param {number} duration      - Approximate duration of the video in seconds (default 4).
 * @returns {Promise<string>}    - Resolves to the URL of the snapshot image.
 */
const getLastFrame = async (videoUrl, shotstackApiKey, duration = 4) => {
  try {
    // Seek just before the end to avoid exact boundary issues
    const trimTime = Math.max(duration - 0.1, 0);

    const requestBody = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "video",
                  src: videoUrl,
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
        format: "jpg",       // Could also be "png"
        resolution: "hd",    // "sd", "hd", "mobile"
        // aspectRatio: "9:16" or "1:1" if you want a custom shape
      },
    };

    // 1) Send render request
    //    Change 'stage' to 'v1' if you are ready for production.
    const renderResponse = await axios.post(
      "https://api.shotstack.io/edit/stage/render",
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
        `https://api.shotstack.io/edit/stage/render/${renderId}`,
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

    // 3) Return the direct URL to the image (hosted by Shotstack)
    return renderUrl;
  } catch (error) {
    console.error("Failed to fetch last frame via Shotstack:", error);
    throw error;
  }
};

export default getLastFrame;
