import React, { useEffect, useState } from 'react';

const MyGenerations = () => {
    const [ incompleteGeneration, setIncompleteGeneration ] = useState();
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        const storedGeneration = localStorage.getItem("task_id");
        if (storedGeneration) {
            const incompleteGeneration = JSON.parse(storedGeneration);
            setIncompleteGeneration(incompleteGeneration);
        } else {
            setIncompleteGeneration(null);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h1>My Generations</h1>
            {incompleteGeneration != null ? (
                <div className="rounded-lg shadow-lg p-2 hover:shadow-2xl hover:outline hover:outline-primary hover:cursor-pointer">
                    <img src="https://picsum.photos/200/300" alt="placeholder" className="rounded-lg"/>
                    <h2 className="text-red-600">⚠️ Incomplete Generation</h2>
                    <p>Generation ID: {incompleteGeneration}</p>
                    <h2 className="text-xl font-bold">Continue Generation</h2>
                </div>
            ) : (
                <p>No incomplete generations found.</p>
            )}
        </div>
    );
}

export default MyGenerations;