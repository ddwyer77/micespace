import React from "react";

const VideoCard = ({videoUrl}) => {
    return (
        <div className="max-w-2xl mb-4 px-8 py-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <video className="w-full" controls autoPlay muted loop>
                <source src={videoUrl} type="video/mp4"/>
            </video>
        </div>                              
    )
}

export default VideoCard;