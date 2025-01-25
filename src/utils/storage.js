// utils/firebaseUtils.js
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
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


export const uploadFile = async (file, path) => {
    try {
        if (!storage) {
            await initializeFirebase();
        }
    
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        console.log("Uploaded file:", snapshot.metadata.fullPath);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading file:", error);
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
            console.log("File List:", fileList); // Debugging
            const urls = await Promise.all(fileList.items.map((item) => getDownloadURL(item)));
            console.log("URLs:", urls); // Debugging
            return urls;
        } catch (error) {
            console.error("Error fetching file URLs:", error);
            throw error;
        }
};