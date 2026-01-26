
import React from 'react';

const Maintenance = () => {
    return (
        <div className="bg-white min-h-screen flex items-center justify-center px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 max-w-4xl">
                {/* Illustration */}
                <div className="flex-shrink-0 w-[130px]" style={{ maxWidth: '180px' }}>
                    <img
                        src="/favicon.svg"
                        alt="Hands with Heart"
                        className="w-full h-auto object-contain"
                    />
                </div>

                {/* Content */}
                <div className="text-center sm:text-left">
                    <h1 className="font-['Poppins',sans-serif] font-semibold text-[#ed505b] text-4xl sm:text-5xl lg:text-[50.4px] leading-tight mb-4">
                        Oops!
                    </h1>
                    <h2 className="font-['Poppins',sans-serif] font-medium text-black text-2xl sm:text-3xl lg:text-[33.134px] leading-tight mb-4">
                        The website<br />
                        under maintenance!
                    </h2>
                    <p className="font-['Poppins',sans-serif] font-normal text-[#5d5757] text-sm sm:text-base lg:text-[15.739px] leading-relaxed">
                        WE ARE COMING SOON
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
