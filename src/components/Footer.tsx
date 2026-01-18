import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Instagram } from 'lucide-react';

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

const Footer = () => {
    const socialLinks = [
        { icon: Instagram, url: '#', label: 'Instagram' },
        { icon: TikTokIcon, url: '#', label: 'TikTok' },
    ];

    return (
        <footer className="pb-6 md:py-12" style={{
            borderTop: '1px solid var(--color-primary-light)',
            backgroundColor: 'var(--color-pink-50)',
            paddingTop: '2rem' // <--- PENGATUR JARAK ATAS MOBILE (32px)
        }}>
            <div className="container-custom">
                {/* Main Grid - Responsive: 1 col mobile, 3 cols desktop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">

                    {/* Brand & Description */}
                    <div className="text-center md:text-left">
                        <Link to="/" className="inline-block mb-2 md:mb-4">
                            <span className="text-xl font-semibold text-[rgb(0,0,0)]">relawanns</span>
                        </Link>
                        <p className="text-xs md:text-sm text-[--color-secondary] max-w-xs mx-auto md:mx-0">
                            Rumah bagi relawan yang percaya bahwa kepedulian kecil dapat menciptakan perubahan besar.
                        </p>
                    </div>

                    {/* Social Media */}
                    <div className="flex flex-col items-center">
                        <h6 className="hidden md:block mb-4 text-[rgb(0,0,0)]">Ikuti Kami</h6>
                        <div className="flex gap-3">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    aria-label={social.label}
                                    className="w-8 md:w-9 h-8 md:h-9 rounded-full border border-gray-300 flex items-center justify-center text-[--color-secondary] hover:border-[--color-primary] hover:text-[--color-primary] transition-colors"
                                >
                                    <social.icon className="w-4 h-4 md:w-4 md:h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-col items-center md:items-end gap-2 md:gap-0">
                        <h6 className="hidden md:block mb-4 text-[rgb(0,0,0)]">Kontak</h6>
                        <ul className="flex flex-col items-center md:items-start gap-2 md:space-y-3">
                            <li>
                                <a href="mailto:info@relawanns.org" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm hover:text-[--color-primary]">
                                    <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-[--color-secondary]" />
                                    <span className="text-[rgb(0,0,0)]">info@relawanns.org</span>
                                </a>
                            </li>
                            <li className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[--color-secondary]" />
                                <span className="text-[rgb(0,0,0)]">Surabaya, Indonesia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright - Always Centered */}
                <div className="pt-4 md:pt-6 text-center">
                    <p className="text-xs md:text-sm text-[--color-secondary] mb-2">
                        © 2025 Isthimataproject. All rights reserved.
                    </p>
                    <div className="flex gap-4 md:gap-6 justify-center">
                        <Link to="#" className="text-xs md:text-sm text-[--color-secondary] hover:text-[--color-primary] transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="#" className="text-xs md:text-sm text-[--color-secondary] hover:text-[--color-primary] transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;