import React, { useState, useEffect } from "react";
import DashboardDataCard from "./DashboardDataCard";
import { getCollectionDocs } from "../utils/storage.js";

const Dashboard = () => {
    const [generatedVideosCount, setGeneratedVideosCount] = useState(0);
    const dataComponents = [< DashboardDataCard title="Videos Generated" number={generatedVideosCount} />];

    useEffect(() => {
        const fetchVideos = async () => {
          try {
            const videos = await getCollectionDocs("videos");
            setGeneratedVideosCount(videos.length);
          } catch (error) {
            console.error("Error fetching videos count:", error);
          }
        };
      
        fetchVideos();
      }, []);

    return (
        <div className="h-screen">
            <h1 className="w-full text-center mt-6">Dashboard</h1>
            <div>
                {dataComponents.map((item, index) => (
                    <div key={index} className="w-full flex justify-center">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;