
import { Link } from 'react-router-dom';


const NotFound = () => {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-4xl">
                <div className="flex-shrink-0 w-[130px]">
                    <img
                        src="/favicon.svg"
                        alt="Page Not Found"
                        className="w-full h-auto object-contain"
                    />
                </div>

                <div className="text-center sm:text-left max-w-md">
                    {/* 404 Text */}
                    <h1 className="text-6xl sm:text-7xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                        404
                    </h1>

                    {/* Main message */}
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-black">
                        Page not found!
                    </h2>
                    <h2 className="text-xl sm:text-2xl font-medium mb-6 text-black">
                        The page you're looking for doesn't exist.
                    </h2>

                    {/* Sorry text */}
                    <p className="text-sm sm:text-base text-gray-500 tracking-wider mb-8">
                        WE'RE SORRY FOR THE INCONVENIENCE
                    </p>

                    {/* Back to home button */}
                    <Link
                        to="/"
                        className="btn-primary inline-block"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
