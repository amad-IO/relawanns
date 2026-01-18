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

// Event Hero Section
const EventHeroSection = () => {
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
                            <span className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm font-semibold shadow-lg">
                                Pendaftaran Dibuka
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
                            Bergabung Bersama Relawanns: Wujudkan Perubahan Nyata untuk Indonesia
                        </h1>

                        {/* Event Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[--color-gray-50] flex items-center justify-center flex-shrink-0">
                                    <MapPin size={18} className="text-[--color-primary]" />
                                </div>
                                <div>
                                    <div className="text-sm text-[--color-secondary] mb-1">Lokasi</div>
                                    <div className="font-semibold text-black">Seluruh Indonesia (Hybrid)</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[--color-gray-50] flex items-center justify-center flex-shrink-0">
                                    <Calendar size={18} className="text-[--color-primary]" />
                                </div>
                                <div>
                                    <div className="text-sm text-[--color-secondary] mb-1">Pendaftaran Dibuka</div>
                                    <div className="font-semibold text-black">Sepanjang Tahun 2025</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// Event Details Section
const EventDetailsSection = () => {
    const details = [
        {
            title: 'Detail Program',
            content: `Relawanns membuka kesempatan bagi individu yang ingin berkontribusi nyata untuk masyarakat Indonesia. 
      Sebagai relawan, Anda akan terlibat langsung dalam berbagai program sosial seperti pendidikan anak, 
      layanan kesehatan gratis, pelestarian lingkungan, dan tanggap bencana. Kegiatan ini dirancang untuk 
      memberikan dampak maksimal kepada masyarakat yang membutuhkan, sambil mengembangkan keterampilan 
      kepemimpinan dan kerjasama tim Anda.`
        }
    ];

    const requirements = [
        'Warga Negara Indonesia (WNI) berusia minimal 17 tahun',
        'Memiliki komitmen dan dedikasi tinggi untuk membantu sesama',
        'Mampu bekerja dalam tim dan berkomunikasi dengan baik',
        'Bersedia mengikuti pelatihan dan orientasi relawan'
    ];

    const criteria = [
        'Peduli terhadap isu sosial dan lingkungan',
        'Adaptif dan mampu bekerja di berbagai kondisi',
        'Proaktif dan memiliki inisiatif tinggi',
        'Bertanggung jawab dan dapat dipercaya'
    ];

    return (
        <section className="section-padding">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Detail */}
                            {details.map((detail, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <h3 className="mb-4">{detail.title}</h3>
                                    <p className="text-[--color-secondary] leading-relaxed">
                                        {detail.content}
                                    </p>
                                </motion.div>
                            ))}

                            {/* Requirements */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <h3 className="mb-4">Persyaratan</h3>
                                <ul className="space-y-3">
                                    {requirements.map((req, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle2 size={20} className="text-[--color-primary] flex-shrink-0 mt-0.5" />
                                            <span className="text-[--color-secondary]">{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Criteria */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <h3 className="mb-4">Kriteria Relawan</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {criteria.map((crit, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[--color-primary] flex-shrink-0 mt-2" />
                                            <span className="text-[--color-secondary] text-sm">{crit}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="sticky top-24 space-y-6"
                            >
                                {/* Quota Info */}
                                <div className="bg-[--color-gray-50] rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Users size={20} className="text-[--color-primary]" />
                                        <h4>Kuota Pendaftaran</h4>
                                    </div>
                                    <div className="text-3xl font-semibold text-[--color-primary] mb-2">
                                        Unlimited
                                    </div>
                                    <p className="text-sm text-[--color-secondary]">
                                        Pendaftaran terbuka sepanjang tahun
                                    </p>
                                </div>

                                {/* Category */}
                                <div className="bg-[--color-gray-50] rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Tag size={20} className="text-[--color-primary]" />
                                        <h4>Kategori</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-white rounded-full text-sm">
                                            Relawan Sosial
                                        </span>
                                        <span className="px-3 py-1.5 bg-white rounded-full text-sm">
                                            Komunitas
                                        </span>
                                    </div>
                                </div>

                                {/* Program Areas */}
                                <div className="bg-[--color-gray-50] rounded-2xl p-6">
                                    <h4 className="mb-4">Bidang Program</h4>
                                    <div className="space-y-2 text-sm text-[--color-secondary]">
                                        <div>• Pendidikan Anak</div>
                                        <div>• Kesehatan Masyarakat</div>
                                        <div>• Pelestarian Lingkungan</div>
                                        <div>• Tanggap Bencana</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;