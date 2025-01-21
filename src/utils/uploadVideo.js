import axios from "axios";

const uploadVideo = async (videoFile, apiKeyShotStack) => {
    const version = "v1";
    try {
        // Step 1: Get the signed URL
        const response = await axios.post(
            `https://api.shotstack.io/edit/${version}/upload`,
            {},
            {
                headers: {
                    Accept: 'application/json',
                    'x-api-key': apiKeyShotStack,
                },
            }
        );

        const signedUrl = response.data.data.attributes.url;
        console.log('Signed URL:', signedUrl);

        // Step 2: Upload the file to the signed URL
        const uploadResponse = await axios.put(signedUrl, videoFile, {
            headers: {
                'Content-Type': videoFile.type, // Use the file's MIME type
                'x-amz-acl': 'public-read', // Ensure the file is accessible (if required)
            },
        });

        console.log('File uploaded successfully:', uploadResponse.status);
        return uploadResponse.status;
    } catch (error) {
        console.error('Error during upload:', error);
        throw error; // Optional: Rethrow for further handling
    }
};

export default uploadVideo;
