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
            const sortedCampaigns = campaigns.sort((a, b) => a.sort - b.sort);
            setCampaigns(sortedCampaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    const openModal = (campaign = null) => {
        setCurrentCampaign(
            campaign || { id: "", name: "", prompt: "", audio: "", image: "", doubleGeneration: false, sort: 0, loadingMessages: "" }
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
    
            if (!currentCampaign.audio.trim()) {
                alert("Audio URL is required");
                return;
            }
    
            if (!currentCampaign.image.trim()) {
                alert("Image URL is required");
                return;
            }
    
            if (!currentCampaign.prompt.trim()) {
                alert("Prompt is required");
                return;
            }

            if (!currentCampaign.loadingMessages.trim()) {
                alert("Loading Messages is required");
                return;
            }
    
            let campaignId = currentCampaign.id;
            if (!campaignId) {
                campaignId = generateCampaignId(currentCampaign.name);
                
                // ✅ Ensure the new ID is set before saving
                const newCampaign = { ...currentCampaign, id: campaignId };
    
                await setDocument("campaigns", campaignId, newCampaign);
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
        if (!currentCampaign.id || currentCampaign.id.trim() === "") {
            alert("Invalid campaign ID. Cannot delete.");
            return;
        }
    
        if (!window.confirm(`Are you sure you want to delete "${currentCampaign.name}"?`)) return;
    
        try {
            console.log(`Attempting to delete campaign: ${currentCampaign.id}`); // ✅ Debugging log
            await deleteDocument("campaigns", currentCampaign.id);
            console.log(`Successfully deleted campaign with ID: ${currentCampaign.id}`);
            
            fetchCampaigns(); // Refresh the campaign list
            closeModal();
        } catch (error) {
            console.error(`Error deleting campaign with ID ${currentCampaign.id}:`, error);
            alert("Failed to delete the campaign. Check console for details.");
        }
    };
    

    return (
        <div className="px-2 md:px-12">
            <h1 className="w-full text-center my-6">Campaigns</h1>
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* New Campaign Button */}
                    <div
                        className="w-full relative overflow-hidden bg-white rounded-lg shadow-lg hover:cursor-pointer hover:outline hover:outline-2 hover:outline-primary"
                        onClick={() => openModal()}
                    >
                        <img className="object-cover w-full h-full min-h-80" src={NewCampaignIcon} alt="new campaign" />
                        <div className="py-5 text-center absolute bottom-0 w-full bg-[rgba(0,0,0,0.7)]">
                            <span className="block md:text-xl font-bold text-white">New Campaign</span>
                        </div>
                    </div>

                    {/* Campaign Cards */}
                    {campaigns.length > 0 ? (
                        campaigns.map((campaign) => (
                            <div
                                key={campaign.id || nanoid()}
                                className="w-full relative overflow-hidden bg-white rounded-lg shadow-lg hover:cursor-pointer hover:outline hover:outline-2 hover:outline-primary"
                                onClick={() => openModal(campaign)}
                            >
                                <img className="object-cover w-full h-full min-h-80" src={campaign.image || ""} alt="avatar" />
                                <div className="py-5 text-center absolute bottom-0 w-full bg-[rgba(0,0,0,0.7)]">
                                    <span className="block md:text-xl font-bold text-white">{campaign.name || "Unknown"}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <h1>Loading Campaigns...</h1>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} showOkButton={false}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">{currentCampaign?.id ? "Edit Campaign" : "New Campaign"}</h2>
                        <small htmlFor="name" className="block mb-2">Name</small>
                        <input
                            type="text"
                            placeholder="Campaign Name"
                            value={currentCampaign.name}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, name: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <small htmlFor="name" className="block mb-2">AI Prompt</small>
                        <textarea
                            type="text"
                            placeholder="Prompt"
                            value={currentCampaign.prompt}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, prompt: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <small htmlFor="name" className="block mb-2">Audio URL</small>
                        <input
                            type="text"
                            placeholder="Audio URL"
                            value={currentCampaign.audio}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, audio: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <small htmlFor="name" className="block mb-2">Image URL</small>
                        <input
                            type="text"
                            placeholder="Image URL"
                            value={currentCampaign.image}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, image: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <small htmlFor="sort" className="block mb-2">Sort Order</small>
                        <input
                            type="number"
                            placeholder="Sort Order"
                            value={currentCampaign.sort}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, sort: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <small htmlFor="loadingMessages" className="block mb-2">Loading Messages (Expected format: Array of strings / Expected amount: More than 50)</small>
                        <textarea
                            type="text"
                            placeholder="Loading Messages"
                            value={currentCampaign.loadingMessages}
                            onChange={(e) => setCurrentCampaign({ ...currentCampaign, loadingMessages: e.target.value })}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <div className="flex gap-2 items-center mb-4">
                            <input
                                type="checkbox"
                                checked={currentCampaign.doubleGeneration}
                                onChange={(e) => setCurrentCampaign({ ...currentCampaign, doubleGeneration: e.target.checked })}
                                className="p-2"
                            />
                            <p htmlFor="name" className="block">Double Generation <span className="text-red-600">(10 second AI section. 2 Hailuo requests.)</span></p>
                        </div>

                        <div className="flex justify-between">
                            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
                                Save
                            </button>
                            {currentCampaign.id && (
                                <button onClick={handleDelete} className="bg-primary text-white px-4 py-2 rounded">
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
