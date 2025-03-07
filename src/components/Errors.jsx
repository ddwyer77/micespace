import React, { useEffect, useState } from "react";
import { getCollectionDocs } from "../utils/storage";

const Errors = () => {
    const [ errors, setErrors ] = useState([]);

    useEffect(() => {
        fetchErrors();
    }, []);

    const fetchErrors = async () => {
        try {
            const errorsData = await getCollectionDocs("errors");
            console.log("Fetched Errors:", errorsData); // Debugging
    
            if (errorsData && Array.isArray(errorsData)) {
                const sortedErrors = errorsData.sort((a, b) => 
                    (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
                );
                setErrors(sortedErrors);
            } else {
                console.error("Unexpected data format for errors:", errorsData);
            }
        } catch (error) {
            console.error("Error fetching errors:", error);
        }
    };
    

    return (
        <div className="p-12">
            <h1 className="w-full text-center mt-6">Errors</h1>
            <ul>
                {errors.length > 0 ? (
                    errors.map((error, index) => (
                        <li key={index} className="border p-2 my-2 shadow-lg rounded-xl">
                            <div className="flex gap-2">
                                <strong>Error: </strong>
                                <p>{error.message}</p>
                            </div>
                            <div className="flex gap-2">
                                <strong>Date: </strong>
                                <p>{new Date(error.timestamp.seconds * 1000).toLocaleString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true
                                })}</p>
                            </div>
                            <div className="flex gap-2">
                                <strong>Task Id: </strong>
                                <p>{error.id}</p>
                            </div>
                            <div className="flex gap-2">
                                <strong>Function Name: </strong>
                                <p>{error.functionName}</p>
                            </div>
                            <div className="flex flex-col">
                                <strong>Stack Trace: </strong>
                                <p>{error.stackTrace}</p>
                            </div>
                            
                            {/* <p>{error.timestamp}</p> */}
                        </li>
                    ))
                ) : (
                    <p>No errors found.</p>
                )}
            </ul>
        </div>
    );
}

export default Errors;