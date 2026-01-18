import React from 'react';
import { motion, useInView } from 'motion/react';
import { Heart, Target, Eye, Award, Users, Globe, HandHeart, Zap } from 'lucide-react';

const About = () => {
    const heroRef = React.useRef(null);
    const storyRef = React.useRef(null);
    const visionRef = React.useRef(null);
    const valuesRef = React.useRef(null);
    const teamRef = React.useRef(null);

    const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
    const storyInView = useInView(storyRef, { once: true, amount: 0.2 });
    const visionInView = useInView(visionRef, { once: true, amount: 0.2 });
    const valuesInView = useInView(valuesRef, { once: true, amount: 0.2 });
    const teamInView = useInView(teamRef, { once: true, amount: 0.2 });

    return (
        <div className="min-h-screen bg-white">
            <motion.div
                ref={heroRef}
                initial={{ opacity: 0, y: 50 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <HeroSection />
            </motion.div>
            <motion.div
                ref={storyRef}
                initial={{ opacity: 0, y: 50 }}
                animate={storyInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <StorySection />
            </motion.div>
            <motion.div
                ref={visionRef}
                initial={{ opacity: 0, y: 50 }}
                animate={visionInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <VisionMissionSection />
            </motion.div>
            <motion.div
                ref={valuesRef}
                initial={{ opacity: 0, y: 50 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <CoreValuesSection />
            </motion.div>
            <motion.div
                ref={teamRef}
                initial={{ opacity: 0, y: 50 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <TeamSection />
            </motion.div>
        </div>
    );
};

// Hero Section
const HeroSection = () => {
    return (
        <section className="relative pt-24 pb-12 bg-white overflow-hidden">
            <div className="container-custom mx-auto px-4">
                <motion.div
                    className="relative w-full h-[50vh] lg:h-[80vh] rounded-[25px] overflow-hidden shadow-lg"
                    style={{ borderRadius: '25px' }}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <motion.img
                        src="/img/4.webp"
                        alt="About Us"
                        className="w-full h-full object-cover object-center lg:object-[center_35%] rounded-[25px]"
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[--color-neutral-900]/80 to-[--color-primary]/70"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    ></motion.div>
                </motion.div>
            </div>
        </section>
    );
};


// CountUp Component
const CountUp = ({ end, duration = 2000, suffix = '' }: { end: number, duration?: number, suffix?: string }) => {
    const [count, setCount] = React.useState(0);
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 }); // Trigger when 50% visible

    React.useEffect(() => {
        if (!isInView) return;

        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function (easeOutQuart) for smoother effect
            const easeOutQuart = (x: number): number => {
                return 1 - Math.pow(1 - x, 4);
            };

            const currentCount = Math.floor(easeOutQuart(progress) * end);
            setCount(currentCount);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure it lands exactly on target
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isInView, end, duration]);

    return (
        <span ref={ref} className="tabular-nums">
            {count}{suffix}
        </span>
    );
};

// StorySection
const StorySection = () => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <section ref={ref} className="section-padding bg-white">
            <div className="container-custom">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="mb-6">Berawal dari Kepedulian, Tumbuh dengan Dedikasi</h2>
                        <p className="mb-4">
                            Relawanns berdiri sebagai komunitas yang lahir dari keinginan sederhana: menjadi jembatan kebaikan bagi sesama. Dimulai dari kegiatan berbagi dan kunjungan rutin ke panti asuhan,
                            Relawanns berkembang menjadi ruang bagi anak muda untuk belajar, bergerak, dan memberikan dampak nyata.
                        </p>
                        <p className="mb-4">
                            Didirikan oleh mahasiswa dan profesional muda dengan semangat sosial yang tinggi, Relawanns kini menghimpun lebih dari 60 staff dan 500+
                            volunteer aktif. Setiap pergerakan kami membawa satu tujuan: menciptakan lingkungan yang penuh kasih, kepedulian, dan kebermanfaatan
                        </p>
                        <p>
                            Dari kegiatan edukasi, pendampingan, hingga program berbagi untuk anak-anak panti asuhan, kami terus berkomitmen menjadi wadah relawan yang
                            menyebarkan kebaikan secara konsisten dan berkelanjutan.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="relative">
                            <img
                                src="/img/6.webp"
                                alt="Our Journey"
                                className="w-full h-80 object-cover rounded-3xl shadow-soft"
                            />
                            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-secondary rounded-3xl -z-10"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-[--color-primary]/10 to-[--color-primary]/5 p-6 rounded-2xl">
                                <h3 className="mb-2 text-[--color-primary] text-4xl lg:text-5xl font-bold">
                                    <CountUp end={2024} duration={2000} />
                                </h3>
                                <p className="text-sm text-[--color-neutral-600]">Tahun Berdiri</p>
                            </div>
                            <div className="bg-gradient-to-br from-[--color-secondary]/10 to-[--color-secondary]/5 p-6 rounded-2xl">
                                <h3 className="mb-2 text-[--color-secondary] text-4xl lg:text-5xl font-bold">
                                    <CountUp end={33} suffix="+" duration={4000} />
                                </h3>
                                <p className="text-sm text-[--color-neutral-600]">Program yang telah dilaksanakan</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// Vision & Mission Section
const VisionMissionSection = () => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <section ref={ref} className="section-padding bg-white">
            <div className="container-custom">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
                    {/* Left Column - Image & Quote */}
                    <motion.div
                        initial={{ opacity: 0, x: -80 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="relative h-full"
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-xl h-full">
                            <img
                                src="/img/5.webp"
                                alt="Vision Mission Cover"
                                className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                            <div className="absolute bottom-0 left-0 p-6 lg:p-10 text-white z-10">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                    className="border-l-4 border-[--color-primary] pl-4 mb-2"
                                >
                                    <p style={{ fontStyle: 'italic' }} className="font-light tracking-wide text-lg sm:text-xl text-white/90">
                                        "Growing with care"
                                    </p>
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mt-3 text-white drop-shadow-lg"
                                >
                                    Menumbuhkan <br />
                                    <span className="text-[--color-primary]">Generasi Peduli Sesama</span>
                                </motion.h2>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Vision & Mission Content */}
                    <div className="flex items-start justify-center">
                        <div className="w-full max-w-xl space-y-12">

                            {/* Visi Kami */}
                            <motion.div
                                initial={{ opacity: 0, x: 80 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-4">
                                        Visi Kami
                                        <span className="h-1 w-12 bg-rose-500 rounded-full"></span>
                                    </h3>
                                </div>

                                <div className="pt-2">
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <div style={{ backgroundColor: '#6b7280' }} className="mt-2 flex-shrink-0 w-2 h-2 rounded-full"></div>
                                            <span style={{ color: '#374151' }} className="leading-relaxed">
                                                Menjadi komunitas relawan yang memberikan pengaruh positif bagi masyarakat melalui kegiatan sosial yang
                                                terstruktur, menyenangkan, dan berkelanjutan, serta menjadi wadah pengembangan diri bagi setiap volunteer.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>

                            {/* Misi Kami */}
                            <motion.div
                                initial={{ opacity: 0, x: 80 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                                className="mt-16"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-4">
                                        Misi Kami
                                        <span className="h-1 w-12 bg-rose-500 rounded-full"></span>
                                    </h3>
                                </div>

                                <div className="pt-2">
                                    <ul className="space-y-4">
                                        {[
                                            "Menghadirkan program sosial yang bermanfaat bagi anak-anak panti asuhan, teman disabilitas, opa oma panti jompo, dan masyarakat yang membutuhkan",
                                            "Mendorong keterlibatan anak muda dalam aksi sosial yang menyenangkan dan penuh makna",
                                            "Menyelenggarakan kegiatan edukasi, berbagi, dan pendampingan yang berdampak jangka panjang",
                                            "Membangun komunitas relawan yang solid, kreatif, dan penuh empati",
                                            "Memperluas jaringan kolaborasi untuk menciptakan kebermanfaatan yang lebih besar"
                                        ].map((item, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div style={{ backgroundColor: '#6b7280' }} className="mt-2 flex-shrink-0 w-2 h-2 rounded-full"></div>
                                                <span style={{ color: '#374151' }} className="leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Core Values Section
const CoreValuesSection = () => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const values = [
        {
            icon: Heart,
            title: 'Kemanusiaan',
            description: 'Mengutamakan kepedulian dan empati dalam setiap tindakan',
            color: 'primary'
        },
        {
            icon: HandHeart,
            title: 'Integritas',
            description: 'Berkomitmen pada kejujuran dan transparansi dalam beroperasi',
            color: 'secondary'
        },
        {
            icon: Users,
            title: 'Kolaborasi',
            description: 'Bekerja sama dengan berbagai pihak untuk dampak maksimal',
            color: 'accent'
        },
        {
            icon: Zap,
            title: 'Inovasi',
            description: 'Terus berinovasi dalam metode dan pendekatan program',
            color: 'primary'
        },
        {
            icon: Award,
            title: 'Profesionalisme',
            description: 'Menjalankan program dengan standar profesional tinggi',
            color: 'secondary'
        },
        {
            icon: Globe,
            title: 'Keberlanjutan',
            description: 'Fokus pada dampak jangka panjang yang berkelanjutan',
            color: 'accent'
        },
    ];

    return (
        <section ref={ref} className="section-padding bg-white">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <h2 className="mb-4">Prinsip yang Kami Pegang</h2>
                    <p className="max-w-2xl mx-auto">
                        Nilai-nilai fundamental yang menjadi dasar setiap kegiatan dan program kami
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {values.map((value, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group bg-gradient-to-br from-pink-50 to-rose-50/30 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-pink-100/50"
                        >
                            <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-md">
                                <value.icon className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="mb-3 text-[--color-primary]">{value.title}</h4>
                            <p className="text-sm text-[--color-neutral-600]">
                                {value.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Team Section
const TeamSection = () => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const team = [
        {
            name: 'Budi Santoso',
            role: 'Ketua Umum',
            image: 'https://images.unsplash.com/photo-1585076800588-77e0884c3191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWFkZXJzaGlwJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Mzg4NTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
            name: 'Siti Rahmawati',
            role: 'Direktur Program',
            image: 'https://images.unsplash.com/photo-1585076800588-77e0884c3191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWFkZXJzaGlwJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Mzg4NTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
            name: 'Ahmad Fauzi',
            role: 'Koordinator Lapangan',
            image: 'https://images.unsplash.com/photo-1585076800588-77e0884c3191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWFkZXJzaGlwJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Mzg4NTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
            name: 'Maya Putri',
            role: 'Manajer Keuangan',
            image: 'https://images.unsplash.com/photo-1585076800588-77e0884c3191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWFkZXJzaGlwJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Mzg4NTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
            name: 'Rudi Hermawan',
            role: 'Kepala Relawan',
            image: 'https://images.unsplash.com/photo-1585076800588-77e0884c3191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWFkZXJzaGlwJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Mzg4NTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
            name: 'Dewi Lestari',
            role: 'Humas & Media',
            image: 'https://images.unsplash.com/photo-1585076800588-77e0884c3191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWFkZXJzaGlwJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Mzg4NTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        },
    ];

    return (
        <section ref={ref} className="section-padding bg-[--color-neutral-50]">

        </section>
    );
};

export default About;