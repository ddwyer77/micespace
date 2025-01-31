import React, {useState, useEffect} from 'react';
import { logout, initializeFirebase  } from "../utils/storage";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import AdminVideos from '../components/AdminVideos';
import Dashboard from '../components/Dashboard';
import EmergencyActions from '../components/EmergencyActions';

const Admin = () => {
	const navigate = useNavigate();
	const [currentScreen, setCurrentScreen] = useState(parseInt(localStorage.getItem("currentScreen")) || 0);
	const tabs = [<Dashboard />, <AdminVideos />, <EmergencyActions />];

	const setCurrentScreenIndex = (index) => {
		setCurrentScreen(index);
		localStorage.setItem("currentScreen", index);
	}

	const handleLogout = async () => {
		await logout();
		navigate("/signin");
	};

	const navigateHome = () => {
        navigate("/");
    };
	return (
		<div className="flex flex-col justify-center w-screen align-center">
			<div className="flex w-full justify-start ">
				<div className="bg-primary">
					<ul className="mt-6">
						<li className="hover:bg-primary-dark hover:cursor-pointer" onClick={navigateHome}>
                            <a className="text-white text-xl hover:text-gray-300 flex flex-col items-center justify-center p-4">
                                <span className="mr-2">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
								<path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
								</svg>

                                </span>
								<span className="text-center">
									Landing
								</span>
                            </a>
                        </li>
						<li className="hover:bg-primary-dark hover:cursor-pointer" onClick={() => setCurrentScreenIndex(0)}>
                            <a className="text-white text-xl hover:text-gray-300 flex flex-col items-center justify-center p-4">
                                <span className="mr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h6v6H3V3zM3 15h6v6H3v-6zM15 3h6v6h-6V3zM15 15h6v6h-6v-6z" />
                                    </svg>
                                </span>
								<span className="text-center">
									Dashboard
								</span>
                            </a>
                        </li>
                        <li className="hover:bg-primary-dark hover:cursor-pointer" onClick={() => setCurrentScreenIndex(1)}>
                            <a className="text-white text-xl hover:text-gray-300 flex flex-col items-center justify-center p-4">
                                <span className="mr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h11a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                                    </svg>
                                </span>
								<span className="text-center">
									Videos
								</span>
                            </a>
                        </li>
                        <li className="hover:bg-primary-dark hover:cursor-pointer" onClick={() => setCurrentScreenIndex(2)}>
                            <a className="text-white text-xl hover:text-gray-300 flex flex-col items-center justify-center p-4">
                                <span className="mr-2">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
								<span className="text-center">
									Emergency Actions
								</span>
                            </a>
                        </li>
					</ul>
				</div>
				<div className="w-full">
					{tabs[currentScreen]}
				</div>
			</div>
		</div>
		
	);
};

export default Admin;