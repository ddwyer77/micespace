import React from 'react';

const Modal = ({ isOpen, onClose, children, showOkButton = true }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
                <div className="flex justify-end items-center">
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900">&times;</button>
                </div>
                <div className="overflow-y-auto">
                    {children}
                </div>
                {showOkButton && (
                    <div className="flex justify-end mt-4">
                        <button onClick={onClose} className="bg-primary text-white px-4 py-2 rounded">Ok</button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Modal;