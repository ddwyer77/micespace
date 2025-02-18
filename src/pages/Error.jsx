import React from 'react';
import errorMouse from '../assets/images/error_mouse.png';
import { Link } from 'react-router-dom';

const Error = () => {
    return (
        <div>
            <img src={errorMouse} className="max-w-80 rounded-lg"/>
            <p className="mt-4">Oh rats! It looks like something went wrong.</p>
            <Link to="/"><button className="bg-primary w-full text-white mt-4">Try again</button></Link>
            
        </div>
    )
}

export default Error