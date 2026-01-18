import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../imports/relawanns-icon";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] =
        useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () =>
            window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Beranda", path: "/#beranda" },
        { name: "Tentang Kami", path: "/about" },
        { name: "Galeri", path: "/gallery" },
        { name: "Daftar", path: "/daftar" },
    ];

    const isActive = (path: string) => {
        if (path === "/#beranda") {
            return (
                location.pathname === "/" &&
                (location.hash === "#beranda" || location.hash === "")
            );
        }
        if (path === "/#galeri") {
            return (
                location.pathname === "/" && location.hash === "#galeri"
            );
        }
        return location.pathname === path;
    };

    const handleNavClick = (path: string) => {
        if (path === "/#beranda") {
            if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                window.location.href = "/";
            }
        } else if (path === "/#galeri") {
            if (location.pathname === "/") {
                // Already on home page, just scroll
                const element = document.getElementById("galeri");
                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            } else {
                // Navigate to home page with hash
                window.location.href = "/#galeri";
            }
        }
    };

    return (
        <>
            {/* Desktop Navbar */}
            <nav
                style={{ zIndex: 99999, borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}
                className={`hidden lg:block fixed top-0 left-0 right-0 bg-white/60 backdrop-blur-md transition-all duration-300 shadow-md ${isScrolled
                    ? ""
                    : ""
                    }`}
            >
                <div className="container-custom">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 318 297"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                <g>
                                    <g>
                                        <path d={svgPaths.p2e35180} fill="black" />
                                        <path d={svgPaths.p2b1a6af0} fill="#FEDCC8" />
                                        <path d={svgPaths.p25a7e100} fill="#FEDCC8" />
                                    </g>
                                    <g>
                                        <path d={svgPaths.p12cfa400} fill="black" />
                                        <path d={svgPaths.p388216c0} fill="#FEDCC8" />
                                        <path d={svgPaths.p22f5ea80} fill="#FEDCC8" />
                                    </g>
                                    <g>
                                        <path d={svgPaths.p2c233580} fill="#ED505B" />
                                    </g>
                                </g>
                            </svg>
                            <span className="text-xl font-semibold text-[--color-primary]">
                                relawanns
                            </span>
                        </Link>

                        {/* Desktop Menu - Centered */}
                        <div className="flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => handleNavClick(link.path)}
                                    className={`text-sm transition-colors ${isActive(link.path)
                                        ? "text-[--color-primary] font-medium"
                                        : "text-[--color-secondary] hover:text-[--color-primary]"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Empty space for balance */}
                        <div className="w-24"></div>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Navbar with Hamburger */}
            <nav
                style={{ zIndex: 99999, borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}
                className={`lg:hidden fixed top-0 left-0 right-0 bg-white/60 backdrop-blur-md transition-all duration-300 shadow-md ${isScrolled
                    ? ""
                    : ""
                    }`}
            >
                <div className="container-custom">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 318 297"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                <g>
                                    <g>
                                        <path d={svgPaths.p2e35180} fill="black" />
                                        <path d={svgPaths.p2b1a6af0} fill="#FEDCC8" />
                                        <path d={svgPaths.p25a7e100} fill="#FEDCC8" />
                                    </g>
                                    <g>
                                        <path d={svgPaths.p12cfa400} fill="black" />
                                        <path d={svgPaths.p388216c0} fill="#FEDCC8" />
                                        <path d={svgPaths.p22f5ea80} fill="#FEDCC8" />
                                    </g>
                                    <g>
                                        <path d={svgPaths.p2c233580} fill="#ED505B" />
                                    </g>
                                </g>
                            </svg>
                            <span className="text-xl font-semibold text-[--color-primary]">
                                relawanns
                            </span>
                        </Link>

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-[--color-primary] hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{ zIndex: 99997 }}
                            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-md"
                        />

                        {/* Menu Panel - Slide from Top */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }}
                            exit={{ y: -380, transition: { type: "spring", stiffness: 130, damping: 28 } }}
                            style={{ zIndex: 99998 }}
                            className="lg:hidden fixed top-24 right-4 w-[90%] max-w-xs bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform-gpu"
                        >
                            <div className="flex flex-col p-4 gap-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Wait for close animation to complete before navigating
                                            setTimeout(() => {
                                                handleNavClick(link.path);
                                            }, 400);
                                        }}
                                        className={`px-4 py-3 rounded-lg text-base transition-colors ${isActive(link.path)
                                            ? "bg-[#ED505B]/10 text-[#ED505B] font-medium"
                                            : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;