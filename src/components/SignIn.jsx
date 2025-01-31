import React, { useState } from "react";
import { signIn } from "../utils/storage";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        try {
            await signIn(email, password);
            navigate("/admin");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">Admin Sign In</h2>
            {error && <p className="text-red-500">{error}</p>}
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="border p-2"
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="border p-2"
                />
                <button type="submit" className="bg-blue-500 text-white p-2">Sign In</button>
            </form>
        </div>
    );
};

export default SignIn;
