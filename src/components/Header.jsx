import React from 'react';
import logoSlogan from '../assets/images/logo_slogan.png'
import { Link } from 'react-router-dom';

const Header = () => { 
    return (
        <div className="absolute top-0 left-0 w-full p-4 shadow-lg flex justify-between items-center">
            <img src={logoSlogan} alt="micespace logo" className="w-48"/>
            <div className="flex justify-end items-center gap-4">
                <Link to="/" className="text-black hover:underline hover:text-primary">Home</Link>
                <Link to="/my-generations" className="text-black hover:underline hover:text-primary">My Generations</Link>
            </div>
        </div>
    );
}

export default Header;