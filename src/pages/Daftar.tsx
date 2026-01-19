import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Users, Tag, CheckCircle2 } from 'lucide-react';
import Form from '../components/Form';

const Contact = () => {
    return (
        <div className="min-h-screen bg-white">
            <EventHeroSection />
            <EventDetailsSection />
            <Form />
        </div>
    );
};

// Event Hero Section with Dynamic Data
const EventHeroSection = () => {
    const [registrationStatus, setRegistrationStatus] = useState({
        isOpen: true,
        message: 'Pendaftaran Dibuka',
        loading: true
    });

    const [eventData, setEventData] = useState({
        title: 'Loading...',
        location: 'Loading...',
        locationMaps: '#',
        date: 'Loading...',
        loading: true
    });

    // Fetch registration status dan event details
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if local or production
                const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                if (isDev) {
                    // Local development: manual hardcode untuk test
                    const isOpen = false; // CHANGE THIS: true = buka, false = tutup

                    setRegistrationStatus({
                        isOpen,
                        message: isOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup',
                        loading: false
                    });

                    // Hardcode event data for local dev
                    setEventData({
                        title: 'Relawanns Mengajar: mengajak adik-adik belajar, bermain, bersama relawanns.',
                        location: 'Surabaya',
                        locationMaps: '#',
                        date: 'Minggu 18 Januari 2025',
                        loading: false
                    });
                    return;
                }

                // Production: fetch dari API
                // Fetch registration status
                const statusResponse = await fetch('/.netlify/functions/check-status');
                const statusResult = await statusResponse.json();

                if (statusResult.success) {
                    setRegistrationStatus({
                        isOpen: statusResult.data.isOpen,
                        message: statusResult.data.isOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup',
                        loading: false
                    });
                }

                // Fetch event details
                const detailsResponse = await fetch('/.netlify/functions/get-event-details');
                const detailsResult = await detailsResponse.json();

                if (detailsResult.success) {
                    // Format date
                    const dateStr = detailsResult.data.date;
                    let formattedDate = dateStr;

                    try {
                        const date = new Date(dateStr);
                        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                        formattedDate = date.toLocaleDateString('id-ID', options);
                    } catch (e) {
                        // Keep original if formatting fails
                    }

                    setEventData({
                        title: detailsResult.data.title,
                        location: detailsResult.data.location,
                        locationMaps: detailsResult.data.locationMaps,
                        date: formattedDate,
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                setRegistrationStatus({
                    isOpen: false,
                    message: 'Pendaftaran Ditutup',
                    loading: false
                });
                setEventData({
                    title: 'Event Relawanns',
                    location: 'Belum diset',
                    locationMaps: '#',
                    date: 'Belum diset',
                    loading: false
                });
            }
        };

        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="pt-20">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto">
                    {/* Event Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-3xl overflow-hidden mb-8 aspect-[16/9]"
                    >
                        <img
                            src="/img/21.webp"
                            alt="Event Relawan"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-6 left-6">
                            <span
                                className={`inline-block px-4 py-2 text-white rounded-full text-sm font-semibold shadow-lg transition-all duration-300`}
                                style={{
                                    backgroundColor: registrationStatus.loading
                                        ? '#6b7280'
                                        : registrationStatus.isOpen
                                            ? '#000000'
                                            : '#dc2626'
                                }}
                            >
                                {registrationStatus.loading ? 'Memuat...' : registrationStatus.message}
                            </span>
                        </div>
                    </motion.div>

                    {/* Event Title & Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h1 className="mb-6 text-black">
                            {eventData.title}
                        </h1>

                        {/* Event Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[--color-gray-50] flex items-center justify-center flex-shrink-0">
                                    <MapPin size={18} className="text-[--color-primary]" />
                                </div>
                                <div>
                                    <div className="text-sm text-[--color-secondary] mb-1">Lokasi</div>
                                    {eventData.locationMaps && eventData.locationMaps !== '#' ? (
                                        <a
                                            href={eventData.locationMaps}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-black hover:text-[--color-primary] transition-colors cursor-pointer"
                                        >
                                            {eventData.location}
                                        </a>
                                    ) : (
                                        <div className="font-semibold text-black">
                                            {eventData.location}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[--color-gray-50] flex items-center justify-center flex-shrink-0">
                                    <Calendar size={18} className="text-[--color-primary]" />
                                </div>
                                <div>
                                    <div className="text-sm text-[--color-secondary] mb-1">Waktu pelaksanaan</div>
                                    <div className="font-semibold text-black">{eventData.date}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// Event Details Section with Dynamic Data
const EventDetailsSection = () => {
    const [eventDetails, setEventDetails] = useState({
        description: 'Memuat deskripsi...',
        requirements: [],
        maxQuota: 0,
        category: 'volunteer',
        loading: true
    });

    React.useEffect(() => {
        const fetchDetails = async () => {
            try {
                const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                if (isDev) {
                    // Hardcode for local dev
                    setEventDetails({
                        description: 'Relawanns membuka kesempatan bagi individu yang ingin berkontribusi nyata untuk masyarakat Indonesia. Sebagai relawan, Anda akan terlibat langsung dalam berbagai program sosial seperti pendidikan anak, layanan kesehatan gratis, pelestarian lingkungan, dan tanggap bencana.',
                        requirements: [
                            'Warga Negara Indonesia (WNI) berusia minimal 17 tahun',
                            'Memiliki komitmen dan dedikasi tinggi untuk membantu sesama',
                            'Mampu bekerja dalam tim dan berkomunikasi dengan baik',
                            'Membayar biaya pendaftaran sebesar Rp. 99.000'
                        ],
                        maxQuota: 25,
                        category: 'Event',
                        loading: false
                    });
                    return;
                }

                // Production: fetch from API
                const response = await fetch('/.netlify/functions/get-event-details');
                const result = await response.json();

                if (result.success) {
                    setEventDetails({
                        description: result.data.description,
                        requirements: result.data.requirements || [],
                        maxQuota: result.data.maxQuota,
                        category: result.data.category === 'volunteer' ? 'Volunteer' : 'Event',
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Failed to fetch details:', error);
                setEventDetails({
                    description: 'Deskripsi tidak tersedia',
                    requirements: [],
                    maxQuota: 0,
                    category: 'Event',
                    loading: false
                });
            }
        };

        fetchDetails();
        // Refresh every 30 seconds
        const interval = setInterval(fetchDetails, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="section-padding">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Deskripsi */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <h3 className="mb-4">Deskripsi Acara</h3>
                                <p className="text-[--color-secondary] leading-relaxed">
                                    {eventDetails.description}
                                </p>
                            </motion.div>

                            {/* Persyaratan - Moved from sidebar */}
                            {eventDetails.requirements.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <h3 className="mb-4">Persyaratan</h3>
                                    <ul className="space-y-3">
                                        {eventDetails.requirements.map((req, index) => (
                                            <li key={index} className="flex items-start gap-2 text-[--color-secondary]">
                                                <CheckCircle2 size={16} className="text-[--color-primary] mt-1 flex-shrink-0" />
                                                <span>{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Kuota */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="bg-[--color-gray-50] p-6 rounded-2xl"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                        <Users size={18} className="text-[--color-primary]" />
                                    </div>
                                    <h5 className="text-black">Kuota Pendaftaran</h5>
                                </div>
                                <p className="font-semibold text-black">
                                    {eventDetails.maxQuota} Relawanns
                                </p>
                            </motion.div>

                            {/* Kategori */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="bg-[--color-gray-50] p-6 rounded-2xl"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                        <Tag size={18} className="text-[--color-primary]" />
                                    </div>
                                    <h5 className="text-black">Kategori</h5>
                                </div>
                                <p className="font-semibold text-black">{eventDetails.category}</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;