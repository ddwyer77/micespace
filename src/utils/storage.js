// utils/firebaseUtils.js
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import axios from "axios";

let app;
let storage;

export const initializeFirebase = async () => {
    if (!app) {
      try {
        // Fetch Firebase config from Netlify function
        const response = await axios.get("/.netlify/functions/firebaseConfig");
        const firebaseConfig = response.data;
  
        // Initialize Firebase app and storage
        app = initializeApp(firebaseConfig);
        storage = getStorage(app);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        throw error;
      }
    }
    return { app, storage };
};

export const uploadFile = async (fileBlob, path) => {
    try {
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, fileBlob);
        const downloadUrl = await getDownloadURL(fileRef);
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading file to Firebase:", error);
        throw error;
    }
};
  
export const getFileUrl = async (folderPath) => {
    try {
        if (!storage) {
            await initializeFirebase();
        }
        const folderRef = ref(storage, folderPath);
        const fileList = await listAll(folderRef);
        const urls = await Promise.all(fileList.items.map((item) => getDownloadURL(item)));
        return urls;
    } catch (error) {
        console.error("Error fetching file URLs:", error);
        throw error;
    }
};

export const deleteFile = async (path) => {
    try {
        if (!storage) {
            await initializeFirebase();
        }
        const fileRef = ref(storage, path);
        await deleteObject(fileRef);
        console.log("File deleted successfully:", path);
    } catch (error) {
        console.error("Error deleting file from Firebase:", error);
        throw error;
    }
};
