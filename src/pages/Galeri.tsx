import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import GaleriFoto from '../components/GaleriFoto';

const Gallery = () => {
    return (
        <div className="min-h-screen bg-white">
            <GalleryContent />
        </div>
    );
};

// Main Gallery Content
const GalleryContent = () => {
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState('Semua');

    const filters = ['Semua', 'Pendidikan', 'Kesehatan', 'Lingkungan', 'Event', 'Sosial'];

    const images = [
        {
            id: 1,
            url: '/img/3.webp',
            category: 'Jahit Kebaikan',
            title: 'Program Beasiswa Anak',
            description: 'Membuat Tempat Pensil Ceria Bersama Adik',
            size: 'large'
        },
        {
            id: 2,
            url: '/img/2.webp',
            category: 'Event',
            title: 'Mangrove Bercerita',
            description: 'Menanam mangrove bersama relawan untuk menjaga pesisir',
            size: 'medium'
        },
        {
            id: 3,
            url: '/img/6.webp',
            category: 'Sosial',
            title: 'Sentuhan Manis',
            description: 'Menghias Donat Untuk Kebaikan',
            size: 'medium'
        },
        {
            id: 4,
            url: '/img/4.webp',
            category: 'Edukasi',
            title: 'Edukasi Lingkungan',
            description: 'Aksi Nyata: Hari Bumi Bersama Anak-Anak',
            size: 'small'
        },
        {
            id: 5,
            url: '/img/5.webp',
            category: 'Event',
            title: 'Merdeka Bersama',
            description: 'Rayakan Kemerdekaan Lewat Kuas dan Canvas',
            size: 'large'
        },
        {
            id: 6,
            url: '/img/2.webp',
            category: 'Event',
            title: 'Picnic Date',
            description: 'Serunya Menghias Bento dan Naik Perahu Bersama Adik Adik',
            size: 'medium'
        },
        {
            id: 7,
            url: '/img/7.webp',
            category: 'Event',
            title: 'Melukis',
            description: 'Lukis Harapan Bersama Relawan Untuk Pejuang',
            size: 'small'
        },
        {
            id: 8,
            url: '/img/8.webp',
            category: 'Special',
            title: '1st Anniversary',
            description: 'Mi(e)lestone Celebration: Bikin Mie',
            size: 'medium'
        },
        {
            id: 9,
            url: '/img/9.webp',
            category: 'Sosial',
            title: 'Bakti Sosial Ramadan',
            description: 'Kegiatan berbagi takjil dan santunan',
            size: 'large'
        },
        {
            id: 10,
            url: '/img/10.webp',
            category: 'Penyemangat',
            title: 'Berbagi Kebahagiaan',
            description: 'Dukungan dan Harapan Bersama Pasien Kanker',
            size: 'small'
        },
        {
            id: 11,
            url: '/img/11.webp',
            category: 'Pendidikan',
            title: 'Kelas Komputer Gratis',
            description: 'Pelatihan komputer untuk remaja putus sekolah',
            size: 'medium'
        },
        {
            id: 12,
            url: '/img/12.webp',
            category: 'Lingkungan',
            title: 'Bersih-Bersih Sungai',
            description: 'Aksi bersih Sungai Ciliwung bersama 200 relawan',
            size: 'small'
        },
        {
            id: 13,
            url: '/img/13.webp',
            category: 'Bencana',
            title: 'Rehab Rumah Gempa',
            description: 'Pembangunan kembali rumah pasca gempa',
            size: 'large'
        },
        {
            id: 14,
            url: '/img/2.webp',
            category: 'Event',
            title: 'Workshop Relawan',
            description: 'Pelatihan keterampilan untuk relawan baru',
            size: 'medium'
        },
        {
            id: 15,
            url: '/img/15.webp',
            category: 'Pendidikan',
            title: 'Donasi Alat Sekolah',
            description: 'Pembagian tas dan alat tulis untuk siswa',
            size: 'small'
        },
        {
            id: 16,
            url: '/img/16.webp',
            category: 'Mangrove',
            title: 'Donor Darah Massal',
            description: 'Kegiatan donor darah bersama PMI',
            size: 'medium'
        },
        {
            id: 17,
            url: '/img/17.webp',
            category: 'Sosial',
            title: 'Kunjungan Panti Asuhan',
            description: 'Berbagi kebahagiaan dengan anak-anak panti',
            size: 'large'
        },
        {
            id: 18,
            url: '/img/18.webp',
            category: 'Event',
            title: 'Annual Gathering',
            description: 'Pertemuan tahunan relawan nasional',
            size: 'small'
        },
        {
            id: 19,
            url: '/img/12.webp',
            category: 'Lingkungan',
            title: 'Clean Up Beach',
            description: 'Aksi bersih pantai Ancol Jakarta',
            size: 'small'
        },
        {
            id: 20,
            url: '/img/20.webp',
            category: 'Pendidikan',
            title: 'Perpustakaan Keliling',
            description: 'Program literasi di pelosok desa',
            size: 'medium'
        },
        {
            id: 21,
            url: '/img/21.webp',
            category: 'Kesehatan',
            title: 'Vaksinasi Gratis',
            description: 'Program vaksinasi untuk anak-anak',
            size: 'small'
        },
    ];

    const filteredImages = activeFilter === 'Semua'
        ? images
        : images.filter(img => img.category === activeFilter);

    return (
        <section className="pt-24 pb-20 bg-white relative">
            <div className="container-custom">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Content - Fixed on Desktop, Normal on Mobile */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`lg:col-span-4 pb-8 transition-opacity duration-300 ${selectedImage ? 'opacity-0 pointer-events-none -z-10' : 'opacity-100'}`}
                        style={window.innerWidth >= 1024 ? {
                            position: 'sticky',
                            top: '6rem',
                            zIndex: 30,
                            alignSelf: 'flex-start'
                        } : {}}
                    >
                        <h1 className="mb-6 text-[rgb(0,0,0)]">Galeri Kegiatan Kami.</h1>
                        <p className="text-lg text-[--color-secondary] mb-8 leading-relaxed">
                            Dokumentasi perjalanan dan aktivitas relawan dalam memberikan dampak positif
                            bagi masyarakat di berbagai wilayah Indonesia.
                        </p>

                        <a
                            href="https://drive.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-block mb-8"
                        >
                            Link Drive
                        </a>
                    </motion.div>

                    {/* Right - Scrollable Gallery Grid Container */}
                    <div className="lg:col-span-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 py-8">
                            {filteredImages.slice(0, 21).map((image, index) => {
                                // Rotasi acak untuk setiap card
                                const rotations = [-8, 4, -5, 7, -3, 6, -4];
                                const rotation = rotations[index % rotations.length];

                                return (
                                    <GaleriFoto
                                        key={image.id}
                                        image={image}
                                        rotation={rotation}
                                        index={index}
                                        onImageClick={setSelectedImage}
                                    />
                                );
                            })}
                        </div>

                        {/* Load More Hint */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-center mt-12"
                        >

                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedImage && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[99999] bg-black"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-300 z-10"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* Content Container */}
                        <div className="h-full flex flex-col items-center justify-center p-6 md:p-12">
                            {/* Image */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full max-w-2xl mb-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.title}
                                    className="w-full rounded-3xl shadow-2xl object-cover max-h-[50vh] md:max-h-[60vh]"
                                />
                            </motion.div>

                            {/* Info Section */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="text-center max-w-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm mb-4">
                                    {selectedImage.category}
                                </span>
                                <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">
                                    {selectedImage.title}
                                </h2>
                                <p className="text-white/80 text-base md:text-lg">
                                    {selectedImage.description}
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </section>
    );
};

export default Gallery;