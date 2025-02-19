import React from 'react';

const Card = ({ imageUrl, name, isSelected, onClick, loading }) => {
    return (
        <div onClick={onClick}  className={`${isSelected ? 'outline outline-2 outline-primary' : ''} w-full max-w-xs overflow-hidden bg-white rounded-lg shadow-lg dark:bg-white hover:cursor-pointer hover:outline hover:outline-2 hover:outline-primary ${loading ? 'pointer-events-none' : ''}`}>
            <img className="object-cover w-full md:h-56" src={imageUrl} alt="avatar" />
            <div className="py-5 text-center">
                <a href="#" className="block md:text-xl font-bold text-gray-800" tabIndex="0" role="link">{name}</a>
            </div>
        </div>
    );
};

export default Card;