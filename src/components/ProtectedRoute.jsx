import React, { useEffect, useState } from "react";
import { authStateListener } from "../utils/storage";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authStateListener((authUser) => {
            setUser(authUser);
            setLoading(false);
        });
    }, []);

    if (loading) return <p>Loading...</p>;
    if (!user) return <Navigate to="/signin" />;

    return children;
};

export default ProtectedRoute;
