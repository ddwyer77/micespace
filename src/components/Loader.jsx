import React from 'react';

const Loader = () => {
    return (
        <div className="animate-spin inline-block size-12 border-[3px] border-current border-t-transparent text-primary rounded-full dark:text-primary" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default Loader;