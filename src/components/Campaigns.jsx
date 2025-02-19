import React, { useEffect, useState } from "react";
import { getCollectionDocs, updateDocument, deleteDocument, setDocument } from "../utils/storage";
import NewCampaignIcon from "../assets/images/new_campaign_icon.png";
import Modal from "./Modal";
import Card from "./Card";
import { nanoid } from "nanoid";

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCampaign, setCurrentCampaign] = useState(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const campaigns = await getCollectionDocs("campaigns");
            setCampaigns(campaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    const openModal = (campaign = null) => {
        setCurrentCampaign(
            campaign || { id: "", name: "", prompt: "", audio: "", image: "" }
        );
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentCampaign(null);
    };

    const generateCampaignId = (name) => {
        let id = name.toLowerCase().replace(/\s+/g, "_");
        return id.length > 20 ? id.substring(0, 20) + "_" + nanoid(5) : id;
    };

    const handleSave = async () => {
        try {
            if (!currentCampaign.name.trim()) {
                alert("Campaign name is required");
                return;
            }

            let campaignId = currentCampaign.id;
            if (!campaignId) {
                campaignId = generateCampaignId(currentCampaign.name);
                await setDocument("campaigns", campaignId, currentCampaign);
            } else {
                await updateDocument("campaigns", campaignId, currentCampaign);
            }

            fetchCampaigns();
            closeModal();
        } catch (error) {
            console.error("Error saving campaign:", error);
        }
    };

    const handleDelete = async () => {
        if (!currentCampaign.id) return;
        if (!window.confirm("Are you sure you want to delete this campaign?")) return;
        try {
            await deleteDocument("campaigns", currentCampaign.id);
            fetchCampaigns();
            closeModal();
        } catch (error) {
            console.error("Error deleting campaign:", error);
        }
    };

    return (
        <div className="px-2 md:px-12">
            <h1 className="w-full text-center my-6">Campaigns</h1>
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* New Campaign Button */}
                    <div
                        className="w-full overflow-hidden bg-white rounded-lg shadow-lg hover:cursor-pointer hover:outline hover:outline-2 hover:outline-primary"
                        onClick={() => openModal()}
                    >
                        <img className="object-cover w-full" src={NewCampaignIcon} alt="new campaign" />
                        <div className="py-5 text-center">
                            <span className="block md:text-xl font-bold text-gray-800">New Campaign</span>
                        </div>
                    </div>

                    {/* Campaign Cards */}
                    {campaigns.length > 0 ? (
                        campaigns.map((campaign) => (
                            <div
                                key={campaign.id}
                                className="w-full overflow-hidden bg-white rounded-lg shadow-lg hover:cursor-pointer hover:outline hover:outline-2 hover:outline-primary"
                                onClick={() => openModal(campaign)}
                            >
                                <img className="object-cover w-full" src={campaign.image || ""} alt="avatar" />
                                <div className="py-5 text-center">
                                    <span className="block md:text-xl font-bold text-gray-800">{campaign.name || "Unknown"}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Loading Campaigns...</p>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">{currentCampaign?.id ? "Edit Campaign" : "New Campaign"}</h2>
                        <input
                            type="text"
                            placeholder="Campaign Name"
                            value={currentCampaign.name}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, name: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Prompt"
                            value={currentCampaign.prompt}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, prompt: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Audio URL"
                            value={currentCampaign.audio}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, audio: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Image URL"
                            value={currentCampaign.image}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, image: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                        />

                        <div className="flex justify-between">
                            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
                                Save
                            </button>
                            {currentCampaign.id && (
                                <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Campaigns;
