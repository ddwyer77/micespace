import React from "react";

const VideoDownloader = ({ videoUrl, fileName = "miceband_video.mp4", bgColor, hoverBgColor, textColor, textContent, redirectUrl = null, icon = null }) => {
  const downloadVideo = async () => {
    try {
      // Fetch the video file
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch the video");
      }

      // Convert the response to a blob
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary <a> element and trigger the download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName; // File name for the downloaded video
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Error downloading the video:", error);
      alert("Failed to download the video. Please try again.");
    }
  };

  return (
    <button
      onClick={downloadVideo}
      className={`flex justify-center items-center ${bgColor} ${textColor} border-none hover:text-white hover:${hoverBgColor} px-4 rounded-lg w-full text-center py-4`}
    >
      {icon}
      <span>{textContent}</span>
    </button>
  );
};

export default VideoDownloader;
