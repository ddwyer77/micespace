import { getCollectionDocs } from "../utils/storage";
import React, { useEffect, useState } from "react";
import NewCampaignIcon from "../assets/images/new_campaign_icon.png";
import Card from "./Card";

const Campaigns = () => {
    const [ campaigns, setCampaigns ] = useState([]);

    useEffect(() => {
        fetchCampaigns();
    }, [])

    const fetchCampaigns = async () => {
        try {
            const campaigns = await getCollectionDocs("campaigns");
            setCampaigns(campaigns);
            console.log("Campaigns:", campaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    }

    return (
        <div className="px-2 md:px-12">
            <h1 className="w-full text-center my-6">Campaigns</h1>
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="w-full overflow-hidden bg-white rounded-lg shadow-lg dark:bg-white hover:cursor-pointer hover:outline hover:outline-2 hover:outline-primary">
                        <img className="object-cover w-full" src={NewCampaignIcon} alt="new campaign" />
                        <div className="py-5 text-center">
                            <a href="#" className="block md:text-xl font-bold text-gray-800">New Campaign</a>
                        </div>
                    </div>
                    {campaigns.length > 0 ? (
                        campaigns
                            .filter(campaign => campaign)
                            .map((campaign, idx) => (
                                <div className="w-full overflow-hidden bg-white rounded-lg shadow-lg dark:bg-white hover:cursor-pointer hover:outline hover:outline-2 hover:outline-primary">
                                    <img className="object-cover w-full" src={campaign?.image || "Unknown"} alt="avatar" />
                                    <div className="py-5 text-center">
                                        <a href="#" className="block md:text-xl font-bold text-gray-800" tabIndex="0" role="link">{campaign?.name || "Unknown"}</a>
                                    </div>
                                </div>
                            ))
                    ) : (
                        <p>Loading Campaigns...</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Campaigns;