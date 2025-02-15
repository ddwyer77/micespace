// utils/firebaseUtils.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, setDoc } from "firebase/firestore";
import axios from "axios";

let app;
let storage;
let auth;
let firestore;

export const initializeFirebase = async () => {
    if (!app) {
      try {
        // Fetch Firebase config from Netlify function
        const response = await axios.get("/.netlify/functions/firebaseConfig");
        const firebaseConfig = response.data;
  
        // Initialize Firebase app and storage
        app = initializeApp(firebaseConfig);
        storage = getStorage(app);
        auth = getAuth(app);
        firestore = getFirestore(app);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        throw error;
      }
    }
    return { app, storage, auth, firestore };
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

export const signIn = async (email, password) => {
    if (!auth) {
        await initializeFirebase();
    }
    return signInWithEmailAndPassword(auth, email, password);
};

// Sign out user
export const logout = async () => {
    if (!auth) {
        await initializeFirebase();
    }
    return signOut(auth);
};

// Listen to auth state changes
export const authStateListener = (callback) => {
    if (!auth) {
        initializeFirebase().then(() => {
            onAuthStateChanged(auth, callback);
        });
    } else {
        onAuthStateChanged(auth, callback);
    }
};

export const getCollectionDocs = async (collectionPath) => {
    try {
      const { firestore } = await initializeFirebase();
      const colRef = collection(firestore, collectionPath);
      const snapshot = await getDocs(colRef);
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      return docsData;
    } catch (error) {
      console.error("Error fetching Firestore collection:", error);
      throw error;
    }
};
  
export const updateDocument = async (collectionPath, docId, data) => {
    try {
        const { firestore } = await initializeFirebase();
        const docRef = doc(firestore, collectionPath, docId);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating Firestore document:", error);
        throw error;
    }
}

export const deleteDocument = async (docId) => {
    try {
      const { firestore } = await initializeFirebase();
      await deleteDoc(doc(firestore, "videos", docId));
      console.log(`Document with ID ${docId} deleted from Firestore.`);
    } catch (error) {
      console.error(`Error deleting document with ID ${docId}:`, error);
      throw error;
    }
};

export const addDocument = async (collectionPath, url, title, generationType) => {
    try {
      const { firestore } = await initializeFirebase();
  
      // Create a doc reference with an auto-generated ID
      const docRef = doc(collection(firestore, collectionPath));
      const docId = docRef.id;
  
      // Build the data object
      const data = {
        id: docId,
        title,
        url,
        inFeed: false,
        isApproved: false,
        createdAt: new Date().toISOString(),
        ownerId: null,
        generationType
      };
  
      // Set the doc with the generated ID
      await setDoc(docRef, data);
  
      console.log(`Document created with ID: ${docId}`);
      return docId;
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
};
  