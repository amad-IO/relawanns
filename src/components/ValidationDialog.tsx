import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileCheck2, X, Check } from 'lucide-react';

interface ValidationDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ValidationDialog: React.FC<ValidationDialogProps> = ({ isOpen, onConfirm, onCancel }) => {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div
                    className="fixed inset-0 !z-[100000] flex items-center justify-center p-4"
                    style={{ zIndex: 100000 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dialog-title"
                >
                    {/* Enhanced Backdrop - Stronger blur and opacity */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-2xl"
                        onClick={onCancel}
                        aria-hidden="true"
                        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                    />

                    {/* Dialog Container - Proportional width */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-[85%] max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-8 text-center">
                            {/* Confirmation Icon (not error) */}
                            <div className="flex justify-center mb-6">
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 15,
                                        delay: 0.1
                                    }}
                                    className="relative"
                                >
                                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50" />
                                    <div className="relative w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200">
                                        <FileCheck2 className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content - Clear microcopy */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <h3
                                    id="dialog-title"
                                    className="text-xl font-bold text-gray-900 mb-3"
                                >
                                    Pastikan Data Sudah Benar
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                    Setelah dikirim, data tidak dapat diubah lagi. Pastikan semua informasi yang Anda masukkan sudah benar.
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed mb-8">
                                    Anda dapat memeriksa kembali sebelum mengirim.
                                </p>
                            </motion.div>

                            {/* Buttons - Centered layout */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-row gap-3 justify-center"
                            >
                                {/* Secondary Action (Cancel) - Left */}
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-2xl transition-all text-sm border-2 border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                    Periksa Kembali
                                </button>

                                {/* Primary Action (Confirm) - Right */}
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', color: '#000000' }}
                                    className="flex items-center justify-center gap-2 px-8 py-4 hover:bg-gray-50 font-semibold rounded-2xl transition-all text-sm border-2 shadow-md hover:shadow-xl"
                                >
                                    Ya, Kirim Data
                                    <Check size={18} strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ValidationDialog;
