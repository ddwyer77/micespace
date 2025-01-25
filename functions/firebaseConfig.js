exports.handler = async () => {
  try {
    // Firebase Config
    const firebaseConfig = {
      apiKey: process.env.VITE_API_KEY_FIREBASE,
      authDomain: process.env.VITE_AUTH_DOMAIN_FIREBASE,
      projectId: process.env.VITE_PROJECT_ID_FIREBASE,
      storageBucket: process.env.VITE_STORAGE_BUCKET_FIREBASE,
      messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID_FIREBASE,
      appId: process.env.VITE_APP_ID_FIREBASE,
    };

    // Return Config to Frontend
    return {
      statusCode: 200,
      body: JSON.stringify(firebaseConfig),
    };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to initialize Firebase" }),
    };
  }
};
