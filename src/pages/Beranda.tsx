import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="min-h-screen bg-white">
            <HeroSection />
            <ProgramShowcase />
            <CTASection />
        </div>
    );
};

// Hero Section - Beranda
const HeroSection = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const hasAnimated = useRef(false);

    useEffect(() => {
        // Mark as animated after first render
        hasAnimated.current = true;
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // Animation only on first visit
    const fadeInUp = hasAnimated.current
        ? { opacity: 1, y: 0 }
        : { opacity: 0, y: 50 };

    return (
        <section
            id="beranda"
            className="relative min-h-screen flex items-center overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            {/* Animated gradient that follows mouse */}
            <div
                className="absolute inset-0 transition-all duration-200 pointer-events-none z-0"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(237, 80, 91, 0.2), transparent 50%)`
                }}
            />

            {/* Static decorative elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

            <div className="container-custom relative">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        className="mb-6 hero-title"
                        initial={fadeInUp}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        Bergerak Bersama,<br />Bermakna untuk Sesama.
                    </motion.h1>
                    <motion.p
                        className="text-base lg:text-2xl text-[--color-secondary] mb-10 max-w-2xl mx-auto leading-relaxed"
                        initial={fadeInUp}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    >
                        Relawanns menjadi ruang bagi sesama yang meyakini bahwa setiap kepedulian, sekecil apa pun, dapat menghadirkan perubahan yang berarti.
                    </motion.p>
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        initial={fadeInUp}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                    >
                        <Link to="/daftar" className="btn-primary inline-flex items-center justify-center gap-2 w-auto">
                            Daftar Sekarang
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// Program Showcase with Images
const ProgramShowcase = () => {
    // Check window size immediately (SSR-safe)
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return true; // Default to mobile for SSR
    });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const showcaseItems = [
        {
            title: 'Relawanns Mengajar',
            description: 'Relawanns mengajak adik-adik belajar mengenal emosi melalui bermain, tumbuh dengan empati, rasa aman, kebahagiaan, dan harapan baru bersama relawan yang peduli sepenuh hati dan kasih.',
            image: '/img/1.webp',
            link: '/programs',
        },
        {
            title: 'Mangrove Bercerita: Menyulam Pesisir, Merajut Harapan',
            description: 'Menanam mangrove bersama relawan untuk menjaga pesisir, merawat alam, menumbuhkan harapan, dan masa depan berkelanjutan.',
            image: '/img/2.webp',
            link: '/programs',
        },
        {
            title: 'Merdeka Bersama melalui Kuas dan Canvas Bersama Teman Disabilitas',
            description: 'Lewat kuas dan kanvas, kami merayakan kemerdekaan, kebebasan berekspresi, dan kebahagiaan bersama teman disabilitas.',
            image: '/img/3.webp',
            link: '/programs',
        },
    ];

    // Animation variants for mobile
    const getMobileAnimation = (index: number) => ({
        initial: {
            opacity: 0,
            x: index % 2 === 0 ? 80 : -80,
            rotate: index % 2 === 0 ? 6 : -6
        },
        whileInView: {
            opacity: 1,
            x: 0,
            rotate: 0
        },
        transition: {
            type: "spring" as const,
            stiffness: 80,
            damping: 20,
            delay: index * 0.1
        }
    });

    // Desktop - fade and slide from left to right sequentially, with tilt rotation
    const getDesktopAnimation = (index: number) => {
        // Get the tilt rotation for each card
        const rotations = [-4, 3, -3];
        return {
            initial: { opacity: 0, y: 50, rotate: 0 },
            whileInView: { opacity: 1, y: 0, rotate: rotations[index] },
            transition: {
                duration: 0.6,
                ease: "easeOut" as const,
                delay: index * 0.2
            }
        };
    };

    return (
        <section className="pt-24 pb-20 overflow-hidden">
            <div className="container-custom">
                {/* Programs Grid - Gallery section removed, now has its own page */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                    {showcaseItems.map((item, index) => {
                        const anim = isMobile ? getMobileAnimation(index) : getDesktopAnimation(index);
                        return (
                            <motion.div
                                key={index}
                                initial={anim.initial}
                                whileInView={anim.whileInView}
                                whileHover={!isMobile ? { rotate: 0 } : undefined}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={anim.transition}
                                className={`program-card ${index === 0 ? 'card-tilt-1' : index === 1 ? 'card-tilt-2' : 'card-tilt-3'}`}
                            >
                                <div className="block group cursor-default">
                                    <div className="bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                        <div className="aspect-[4/3] overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                        <div className="p-8">
                                            <h4 className="mb-3 text-[rgb(0,0,0)]">{item.title}</h4>
                                            <p className="text-sm text-[--color-secondary] mb-6 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

//tentang kami
const CTASection = () => {
    return (
        <section className="section-padding">
            <div className="container-custom">
                <div className="max-w-3xl lg:max-w-5xl mx-auto text-center">
                    <motion.h2
                        className="mb-6 cta-title"
                        initial={{ opacity: 0, x: -100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        Satu Langkah Kecilmu,<br />Berarti Besar bagi Sesama
                    </motion.h2>
                    <motion.p
                        className="cta-paragraph text-[--color-secondary] mb-10 mx-auto px-4 md:px-6"
                        initial={{ opacity: 0, x: 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    >
                        Mari tumbuh dan berdampak bersama Relawanns, ruang terbuka bagi siapa pun untuk berbagi, belajar, berkolaborasi, dan mewujudkan aksi nyata penuh makna bagi sesama serta masa depan lebih baik.
                    </motion.p>
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Link to="/about" className="btn-secondary w-auto">
                            Tentang kami
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Home;