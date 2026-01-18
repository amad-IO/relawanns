import React from 'react';
import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';

interface GaleriFotoProps {
    image: {
        id: number;
        url: string;
        category: string;
        title: string;
        description: string;
        size: string;
    };
    rotation: number;
    index: number;
    onImageClick: (image: any) => void;
}

const GaleriFoto: React.FC<GaleriFotoProps> = ({ image, rotation, index, onImageClick }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isLongPressed, setIsLongPressed] = React.useState(false);
    const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

    // Handle long press start (touchstart)
    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setIsLongPressed(true);
        }, 500); // 500ms untuk trigger long press
    };

    // Handle long press end (touchend/touchcancel)
    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        setIsLongPressed(false);
    };

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);

    // Determine final rotation and overlay visibility
    const finalRotation = isLongPressed ? 0 : rotation;
    const showOverlay = isHovered || isLongPressed;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: finalRotation }}
            whileHover={{ rotate: 0, zIndex: 10 }}
            transition={{ duration: 0.4, delay: index * 0.03 }}
            className={`group relative cursor-pointer shadow-xl bg-gray-100 select-none ${image.size === 'large' ? 'col-span-2 row-span-2 aspect-[4/3]' :
                image.size === 'medium' ? 'col-span-1 row-span-1 aspect-square' :
                    'col-span-1 row-span-1 aspect-[3/4]'
                }`}
            style={{
                overflow: 'hidden',
                borderRadius: '1rem',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
            } as React.CSSProperties}
            onClick={() => onImageClick(image)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Image */}
            <motion.img
                src={image.url}
                alt={image.title}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ scale: 1.05 }}
                animate={{ scale: (isHovered || isLongPressed) ? 1.2 : 1.05 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ transformOrigin: 'center' }}
            />

            {/* Overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 flex flex-col justify-end p-6 z-10 pointer-events-none ${showOverlay ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{ borderRadius: '1rem' }}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">
                        {image.category}
                    </span>
                    <ZoomIn className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-white mb-1 text-sm">{image.title}</h4>
                <p className="text-xs text-white/80 line-clamp-2">{image.description}</p>
            </div>
        </motion.div>
    );
};

export default GaleriFoto;
