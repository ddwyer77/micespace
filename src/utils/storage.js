// utils/firebaseUtils.js
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Replace with your Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY_FIREBASE,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN_FIREBASE,
    projectId: import.meta.env.VITE_PROJECT_ID_FIREBASE,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET_FIREBASE,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID_FIREBASE,
    appId: import.meta.env.VITE_APP_ID_FIREBASE
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage.
 * @param {File} file - The file to upload.
 * @param {string} path - The storage path to upload the file to.
 * @returns {Promise<string>} - Returns a promise that resolves with the file's download URL.
 */
export const uploadFile = async (file, path) => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        console.log('Uploaded file:', snapshot.metadata.fullPath);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

/**
 * Retrieve a file's download URL from Firebase Storage.
 * @param {string} path - The storage path of the file.
 * @returns {Promise<string>} - Returns a promise that resolves with the file's download URL.
 */
export const getFileUrl = async (path) => {
    try {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error('Error retrieving file URL:', error);
        throw error;
    }
};
