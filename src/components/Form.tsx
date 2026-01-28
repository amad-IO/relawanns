import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Upload, X, ChevronRight, ChevronLeft, AlertCircle, ChevronDown } from 'lucide-react';
import ValidationDialog from './ValidationDialog';
import { compressImage } from '../utils/imageCompression';

// ... (existing code) ...

// AFTER the main Form component and BEFORE export default

interface DropdownOption {
    value: string;
    label: string;
}

const CustomDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    error
}: {
    value: string;
    onChange: (val: string) => void;
    options: DropdownOption[];
    placeholder: string;
    error?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 border rounded-xl flex justify-between items-center cursor-pointer bg-white transition-all ${error ? 'border-red-500' : isOpen ? 'border-black ring-1 ring-black' : 'border-gray-200'
                    }`}
            >
                <span className={value ? "text-black font-medium" : "text-gray-400"}>
                    {value ? selectedLabel : placeholder}
                </span>
                <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto"
                    >
                        {options.map((opt) => (
                            <motion.div
                                key={opt.value}
                                whileTap={{ scale: 0.98, backgroundColor: "#f3f4f6" }}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-3 cursor-pointer text-sm transition-colors ${value === opt.value ? 'bg-gray-50 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-black active:bg-gray-100'
                                    }`}
                            >
                                {opt.label}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <ErrorMsg msg={error || ''} />
        </div>
    );
};

// ... existing sub-components ...

const Form = () => {
    // Current Step: 1, 2, or 3
    const [currentStep, setCurrentStep] = useState(1);
    const formRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        phone: string;
        age: string;
        city: string;
        instagramUsername: string;
        participationHistory: string;
        vestSize: string;
        tiktokProof: File | null;
        instagramProof: File | null;
        paymentProof: File | null;
    }>({
        name: '',
        email: '',
        phone: '',
        age: '',
        city: '',
        instagramUsername: '',
        participationHistory: '',
        vestSize: '',
        tiktokProof: null,
        instagramProof: null,
        paymentProof: null
    });

    const [compressedPayment, setCompressedPayment] = useState<File | null>(null);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Mengirim...');

    // File Names for display
    const [fileNames, setFileNames] = useState({
        payment: '',
        tiktok: '',
        instagram: ''
    });

    // File Errors
    const [fileErrors, setFileErrors] = useState({
        payment: '',
        tiktok: '',
        instagram: ''
    });

    const [showDialog, setShowDialog] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        city: '',
        instagramUsername: '',
        participationHistory: '',
        vestSize: ''
    });

    // Registration status from API
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [statusLoading, setStatusLoading] = useState(true);

    // Fetch registration status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Import Supabase client
                const { supabase } = await import('../lib/supabase');

                // Fetch registration status from Supabase
                const { data, error } = await supabase
                    .from('event_settings')
                    .select('value')
                    .eq('key', 'registration_status')
                    .single();

                if (error) throw error;

                setRegistrationOpen(data?.value === 'open');
            } catch (error) {
                console.error('Failed to fetch registration status:', error);
                setRegistrationOpen(false);
            } finally {
                setStatusLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // Sanitize input
    const sanitizeInput = (input: string): string => {
        if (!input) return '';
        let sanitized = input;
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/(\bSELECT\b.*\bFROM\b)/gi, '');
        sanitized = sanitized.replace(/(\bINSERT\b.*\bINTO\b)/gi, '');
        return sanitized.replace(/;/g, '');
    };

    // Validation Logic
    const validateField = (name: string, value: string): string => {
        if (!value || value.trim() === '') return '';

        switch (name) {
            case 'name':
                if (!/^[a-zA-Z\s.]+$/.test(value) || value.length < 3) return 'Nama lengkap tidak valid';
                break;
            case 'email':
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return 'Email tidak valid';
                break;
            case 'phone':
                if (!/^(08|62)\d{8,13}$/.test(value)) return 'Nomor WhatsApp tidak valid (awali 08/62)';
                break;
            case 'age':
                const ageNum = parseInt(value);
                if (isNaN(ageNum) || ageNum < 17 || ageNum > 60) return 'Usia tidak valid (17-60)';
                break;
            case 'city':
                if (!/^[a-zA-Z\s]+$/.test(value) || value.length > 30) return 'Kota domisili tidak valid';
                break;
            case 'instagramUsername':
                if (!value.startsWith('@')) return 'Username harus diawali dengan @';
                if (value.length < 3) return 'Username terlalu pendek';
                break;
        }
        return '';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time validation
        const error = validateField(name, value);
        setValidationErrors(prev => ({ ...prev, [name]: error }));
    };

    // Generic File Handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'paymentProof' | 'tiktokProof' | 'instagramProof') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset errors for this field
        const key = fieldName === 'paymentProof' ? 'payment' : fieldName === 'tiktokProof' ? 'tiktok' : 'instagram';

        setFileErrors(prev => ({ ...prev, [key]: '' }));
        setFileNames(prev => ({ ...prev, [key]: '' }));
        setFormData(prev => ({ ...prev, [fieldName]: null }));
        if (fieldName === 'paymentProof') setCompressedPayment(null);

        // Validation
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (!extension || !allowedExtensions.includes(extension)) {
            setFileErrors(prev => ({ ...prev, [key]: 'Hanya JPG, PNG, atau PDF' }));
            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setFileErrors(prev => ({ ...prev, [key]: 'Maksimal ukuran 5MB' }));
            e.target.value = '';
            return;
        }

        // Success
        setFormData(prev => ({ ...prev, [fieldName]: file }));
        setFileNames(prev => ({ ...prev, [key]: file.name }));

        // Background Compression (only for payment proof for now)
        if (fieldName === 'paymentProof' && file.type.startsWith('image/')) {
            compressImage(file, 0.8, 1280).then(res => setCompressedPayment(res)).catch(console.warn);
        }
    };

    const removeFile = (fieldName: 'paymentProof' | 'tiktokProof' | 'instagramProof') => {
        const key = fieldName === 'paymentProof' ? 'payment' : fieldName === 'tiktokProof' ? 'tiktok' : 'instagram';
        setFormData(prev => ({ ...prev, [fieldName]: null }));
        setFileNames(prev => ({ ...prev, [key]: '' }));
        const input = document.getElementById(fieldName) as HTMLInputElement;
        if (input) input.value = '';
    };

    // Step Navigation Validation
    const validateStep = (step: number) => {
        const errors: any = {};
        let isValid = true;

        if (step === 1) {
            if (!formData.name) errors.name = 'Wajib diisi';
            if (!formData.email) errors.email = 'Wajib diisi';
            if (!formData.phone) errors.phone = 'Wajib diisi';
            if (!formData.age) errors.age = 'Wajib diisi';
            if (!formData.city) errors.city = 'Wajib diisi';
            if (!formData.instagramUsername) errors.instagramUsername = 'Wajib diisi';
            if (!formData.participationHistory) errors.participationHistory = 'Wajib dipilih';

            if (Object.keys(errors).length > 0) isValid = false;
            if (Object.values(validationErrors).some(e => e !== '')) isValid = false;
        }

        if (step === 2) {
            if (!formData.vestSize) errors.vestSize = 'Wajib dipilih';

            if (Object.keys(errors).length > 0) isValid = false;
        }

        setValidationErrors(prev => ({ ...prev, ...errors }));
        return isValid;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let isValid = true;

        if (!formData.tiktokProof) {
            setFileErrors(prev => ({ ...prev, tiktok: 'Bukti follow TikTok wajib diunggah' }));
            isValid = false;
        }
        if (!formData.instagramProof) {
            setFileErrors(prev => ({ ...prev, instagram: 'Bukti follow IG wajib diunggah' }));
            isValid = false;
        }
        if (!formData.paymentProof) {
            setFileErrors(prev => ({ ...prev, payment: 'Bukti pembayaran wajib diunggah' }));
            isValid = false;
        }

        if (!isValid) return;

        setShowDialog(true);
    };

    const handleConfirmSubmit = async () => {
        setShowDialog(false);
        setIsSubmitting(true);
        setStatusMessage('Memproses...');

        try {
            // Import Supabase client
            const { supabase } = await import('../lib/supabase');

            // ===== CHECK QUOTA BEFORE PROCESSING =====
            setStatusMessage('Memeriksa kuota pendaftaran...');

            // Get settings (key-value schema)
            const { data: settingsRows, error: settingsError } = await supabase
                .from('event_settings')
                .select('key, value')
                .in('key', ['registration_status', 'current_registrants', 'max_quota']);

            if (settingsError) {
                throw new Error('Gagal mengecek status pendaftaran');
            }

            // Convert to object
            const eventSettings: Record<string, string> = {};
            settingsRows?.forEach(row => {
                eventSettings[row.key] = row.value;
            });

            // Check if registration is closed
            if (eventSettings.registration_status === 'close') {
                setIsSubmitting(false);
                setStatusMessage('');
                alert('❌ Maaf, pendaftaran sudah ditutup!');
                return;
            }

            // Check if quota is full
            const currentCount = parseInt(eventSettings.current_registrants || '0');
            const maxQuota = parseInt(eventSettings.max_quota || '100');

            if (currentCount >= maxQuota) {
                setIsSubmitting(false);
                setStatusMessage('');
                alert(`❌ Maaf, kuota pendaftaran sudah penuh! (${currentCount}/${maxQuota})`);
                return;
            }

            setStatusMessage('Memproses pendaftaran...');

            // Sanitize input data
            const cleanData = {
                name: sanitizeInput(formData.name),
                email: sanitizeInput(formData.email),
                phone: sanitizeInput(formData.phone),
                age: sanitizeInput(formData.age),
                city: sanitizeInput(formData.city),
                instagramUsername: sanitizeInput(formData.instagramUsername),
                participationHistory: formData.participationHistory,
                vestSize: formData.vestSize
            };

            // Upload files to Supabase Storage
            const timestamp = Date.now();
            const fileUrls: {
                paymentProof?: string;
                tiktokProof?: string;
                instagramProof?: string;
            } = {};
            const filesToSync: { url: string; name: string }[] = [];

            // Upload payment proof
            if (compressedPayment || formData.paymentProof) {
                const file = compressedPayment || formData.paymentProof;
                if (file) {
                    const fileName = `payment_${timestamp}_${cleanData.name.replace(/\s+/g, '_')}.${file.name.split('.').pop()}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('registrations')
                        .upload(fileName, file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) throw new Error('Gagal upload bukti pembayaran: ' + uploadError.message);

                    const { data: urlData } = supabase.storage
                        .from('registrations')
                        .getPublicUrl(fileName);

                    fileUrls.paymentProof = urlData.publicUrl;
                    filesToSync.push({ url: urlData.publicUrl, name: fileName });
                }
            }

            // Upload TikTok proof
            if (formData.tiktokProof) {
                const fileName = `tiktok_${timestamp}_${cleanData.name.replace(/\s+/g, '_')}.${formData.tiktokProof.name.split('.').pop()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('registrations')
                    .upload(fileName, formData.tiktokProof, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw new Error('Gagal upload bukti TikTok: ' + uploadError.message);

                const { data: urlData } = supabase.storage
                    .from('registrations')
                    .getPublicUrl(fileName);

                fileUrls.tiktokProof = urlData.publicUrl;
                filesToSync.push({ url: urlData.publicUrl, name: fileName });
            }

            // Upload Instagram proof
            if (formData.instagramProof) {
                const fileName = `instagram_${timestamp}_${cleanData.name.replace(/\s+/g, '_')}.${formData.instagramProof.name.split('.').pop()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('registrations')
                    .upload(fileName, formData.instagramProof, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw new Error('Gagal upload bukti Instagram: ' + uploadError.message);

                const { data: urlData } = supabase.storage
                    .from('registrations')
                    .getPublicUrl(fileName);

                fileUrls.instagramProof = urlData.publicUrl;
                filesToSync.push({ url: urlData.publicUrl, name: fileName });
            }

            // Insert registration data to Supabase
            const { data: insertData, error: insertError } = await supabase
                .from('registrations')
                .insert([{
                    name: cleanData.name,
                    email: cleanData.email,
                    phone: cleanData.phone,
                    age: parseInt(cleanData.age),
                    city: cleanData.city,
                    instagram_username: cleanData.instagramUsername,
                    participation_history: cleanData.participationHistory === 'yes',
                    vest_size: cleanData.vestSize,
                    payment_proof_url: fileUrls.paymentProof,
                    tiktok_proof_url: fileUrls.tiktokProof,
                    instagram_proof_url: fileUrls.instagramProof,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (insertError) throw new Error('Gagal menyimpan pendaftaran: ' + insertError.message);

            // Trigger Background Process via Queue (Fast!!)
            try {
                setStatusMessage('Menyimpan ke antrian background...');

                // Get event details
                const { data: eventData } = await supabase
                    .from('event_settings')
                    .select('key, value')
                    .in('key', ['event_title', 'event_date']);

                const eventSettings: Record<string, any> = {};
                eventData?.forEach(item => {
                    eventSettings[item.key] = item.value;
                });

                // Simplified payload for queue
                const queuePayload = {
                    registrationId: insertData[0].id,
                    files: {
                        paymentProof: {
                            url: fileUrls.paymentProof,
                            filename: `payment_${timestamp}_${cleanData.name.replace(/\s+/g, '_')}.${formData.paymentProof?.name.split('.').pop()}`,
                            type: 'payment'
                        },
                        tiktokProof: {
                            url: fileUrls.tiktokProof,
                            filename: `tiktok_${timestamp}_${cleanData.name.replace(/\s+/g, '_')}.${formData.tiktokProof?.name.split('.').pop()}`,
                            type: 'tiktok'
                        },
                        instagramProof: {
                            url: fileUrls.instagramProof,
                            filename: `instagram_${timestamp}_${cleanData.name.replace(/\s+/g, '_')}.${formData.instagramProof?.name.split('.').pop()}`,
                            type: 'instagram'
                        }
                    },
                    eventTitle: eventSettings.event_title || 'Event Relawanns',
                    eventDate: eventSettings.event_date || new Date().toISOString().split('T')[0]
                };

                // Call enqueue API (fast response!)
                const response = await fetch('/api/enqueue-job', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(queuePayload)
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    console.error('Failed to enqueue job:', result);
                    // Don't throw - data is already in database
                } else {
                    console.log('✅ Job enqueued successfully:', result.jobId);
                    console.log('📊 Queue stats:', result.queueStats);
                }

            } catch (bgError) {
                console.error('Queue enqueue warning:', bgError);
                // Non-blocking - data is already saved in database
            }

            setIsSubmitted(true);
            setIsSubmitting(false);

        } catch (error: any) {
            console.error('Submission error:', error);
            setIsSubmitting(false);
            alert(error.message || 'Terjadi kesalahan saat mendaftar');
        }
    };

    return (
        <>
            <ValidationDialog
                isOpen={showDialog}
                onConfirm={handleConfirmSubmit}
                onCancel={() => setShowDialog(false)}
            />

            <section className="py-20 bg-gradient-to-b from-white to-gray-50 min-h-screen">
                <div className="container-custom">
                    <div className="max-w-2xl mx-auto">

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-8"
                        >
                            <h2 className="mb-2">Pendaftaran Volunteer</h2>
                            <p className="text-gray-500">Langkah {currentStep} dari 3</p>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 h-2 rounded-full mt-4 overflow-hidden">
                                <motion.div
                                    className="h-full bg-black"
                                    initial={{ width: '33%' }}
                                    animate={{ width: `${(currentStep / 3) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            ref={formRef}
                            className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={40} className="text-green-600" />
                                    </div>
                                    <h3 className="mb-3">Pendaftaran Berhasil!</h3>
                                    <p className="text-gray-500">Terima kasih telah mendaftar.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">

                                    {/* ----- STEP 1: DATA DIRI ----- */}
                                    {currentStep === 1 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                            <h3 className="text-xl font-semibold mb-4">Informasi Pribadi</h3>

                                            {/* Nama */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                                                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black" placeholder="Nama sesuai KTP" required />
                                                <ErrorMsg msg={validationErrors.name} />
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-2">Email <span className="text-red-500">*</span></label>
                                                <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black" placeholder="email@example.com" required />
                                                <ErrorMsg msg={validationErrors.email} />
                                            </div>

                                            {/* WA */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-2">No. WhatsApp <span className="text-red-500">*</span></label>
                                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black" placeholder="08xxxxxxxxxx" required />
                                                <ErrorMsg msg={validationErrors.phone} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Usia */}
                                                <div>
                                                    <label className="block text-sm font-medium text-black mb-2">Usia <span className="text-red-500">*</span></label>
                                                    <input type="number" name="age" value={formData.age} onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black" placeholder="17-60" required />
                                                    <ErrorMsg msg={validationErrors.age} />
                                                </div>
                                                {/* Kota */}
                                                <div>
                                                    <label className="block text-sm font-medium text-black mb-2">Kota <span className="text-red-500">*</span></label>
                                                    <input type="text" name="city" value={formData.city} onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black" placeholder="Jakarta" required />
                                                    <ErrorMsg msg={validationErrors.city} />
                                                </div>
                                            </div>

                                            {/* IG */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-2">Akun Instagram (Aktif) <span className="text-red-500">*</span></label>
                                                <input type="text" name="instagramUsername" value={formData.instagramUsername} onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black" placeholder="@username" required />
                                                <ErrorMsg msg={validationErrors.instagramUsername} />
                                            </div>

                                            {/* History */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-2">Pernah ikut kegiatan Relawanns? <span className="text-red-500">*</span></label>
                                                <CustomDropdown
                                                    value={formData.participationHistory}
                                                    onChange={(val) => handleInputChange({ target: { name: 'participationHistory', value: val } } as any)}
                                                    options={[
                                                        { value: 'Sudah Pernah', label: 'Sudah Pernah' },
                                                        { value: 'Belum Pernah', label: 'Belum Pernah' }
                                                    ]}
                                                    placeholder="Pilih Jawaban"
                                                    error={validationErrors.participationHistory || ''}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ----- STEP 2: ATRIBUT & TASK ----- */}
                                    {currentStep === 2 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <h3 className="text-xl font-semibold mb-4">Atribut & Tugas</h3>

                                            {/* Vest Size */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-2">Pilih Ukuran Vest <span className="text-red-500">*</span></label>

                                                {/* Vest Image */}
                                                <div className="flex justify-center mb-6">
                                                    <div className="relative group">
                                                        <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                                        <img
                                                            src="/img/vest.webp"
                                                            alt="Vest Relawanns"
                                                            style={{ width: '220px', height: 'auto' }}
                                                            className="relative object-cover rounded-3xl shadow-2xl border-4 border-white transform transition-transform duration-500 hover:scale-[1.02]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Size Chart Visualization Placeholder */}
                                                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 text-sm md:text-base">
                                                    <p className="font-medium mb-2 text-center">Size Chart Vest</p>
                                                    <div className="grid grid-cols-1 gap-2 text-gray-600">
                                                        <div className="flex justify-between border-b pb-1"><span>M</span> <span>Panjang 62 cm, Lingkar Dada 53 cm</span></div>
                                                        <div className="flex justify-between border-b pb-1"><span>L</span> <span>Panjang 64 cm, Lingkar Dada 55 cm</span></div>
                                                        <div className="flex justify-between"><span>XL</span> <span>Panjang 64 cm, Lingkar Dada 57 cm</span></div>
                                                    </div>
                                                </div>

                                                <CustomDropdown
                                                    value={formData.vestSize}
                                                    onChange={(val) => handleInputChange({ target: { name: 'vestSize', value: val } } as any)}
                                                    options={[
                                                        { value: 'M', label: 'M — Panjang 62 cm, Lingkar Dada 53 cm' },
                                                        { value: 'L', label: 'L — Panjang 64 cm, Lingkar Dada 55 cm' },
                                                        { value: 'XL', label: 'XL — Panjang 64 cm, Lingkar Dada 57 cm' }
                                                    ]}
                                                    placeholder="Pilih Ukuran"
                                                    error={validationErrors.vestSize || ''}
                                                />
                                            </div>

                                            <div className="border-t border-gray-100 my-4 pt-4"></div>
                                        </motion.div>
                                    )}

                                    {/* ----- STEP 3: FINALISASI ----- */}
                                    {currentStep === 3 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <h3 className="text-xl font-semibold mb-4">Pembayaran</h3>

                                            {/* Summary */}
                                            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-2 mb-6">
                                                <p><span className="font-semibold">Nama:</span> {formData.name}</p>
                                                <p><span className="font-semibold">Email:</span> {formData.email}</p>
                                                <p><span className="font-semibold">Vest:</span> {formData.vestSize} (Size)</p>
                                            </div>

                                            {/* TikTok Proof */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-1">1. Follow TikTok Kami <span className="text-red-500">*</span></label>
                                                <a href="https://www.tiktok.com/@relawanns" target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline mb-3 inline-block font-medium">
                                                    Klik disini: tiktok.com/@relawanns
                                                </a>
                                                <p className="text-xs text-gray-500 mb-2">Upload bukti follow (screenshot)</p>
                                                <FileUpload
                                                    id="tiktokProof"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'tiktokProof')}
                                                    fileName={fileNames.tiktok}
                                                    error={fileErrors.tiktok}
                                                    onRemove={() => removeFile('tiktokProof')}
                                                />
                                            </div>

                                            {/* IG Proof */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-1">2. Follow Instagram Kami <span className="text-red-500">*</span></label>
                                                <p className="text-sm text-gray-600 mb-3">@relawanns</p>
                                                <p className="text-xs text-gray-500 mb-2">Upload bukti follow (screenshot)</p>
                                                <FileUpload
                                                    id="instagramProof"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'instagramProof')}
                                                    fileName={fileNames.instagram}
                                                    error={fileErrors.instagram}
                                                    onRemove={() => removeFile('instagramProof')}
                                                />
                                            </div>

                                            {/* Payment Proof */}
                                            <div>
                                                <label className="block text-sm font-medium text-black mb-2">Upload Bukti Pembayaran <span className="text-red-500">*</span></label>
                                                <FileUpload
                                                    id="paymentProof"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'paymentProof')}
                                                    fileName={fileNames.payment}
                                                    error={fileErrors.payment}
                                                    onRemove={() => removeFile('paymentProof')}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Navigation Buttons */}
                                    {/* Navigation Buttons */}
                                    <div className="flex items-center justify-between pt-8 mt-4 border-t border-gray-100">
                                        <div>
                                            {currentStep > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={prevStep}
                                                    disabled={isSubmitting}
                                                    className="px-6 py-2.5 rounded-full border border-gray-200 text-red-600 font-medium hover:bg-red-50 transition-all flex items-center gap-2 group"
                                                >
                                                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                                    Kembali
                                                </button>
                                            )}
                                        </div>

                                        <div>
                                            {currentStep < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={nextStep}
                                                    className="px-8 py-2.5 rounded-full bg-black text-white font-medium hover:bg-gray-900 transition-all flex items-center gap-2 shadow-md hover:shadow-lg group"
                                                >
                                                    Lanjut
                                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button (Only Step 3) - Full width below nav */}
                                    {currentStep === 3 && (
                                        <div className="mt-6">
                                            <button
                                                type="submit"
                                                disabled={!registrationOpen || isSubmitting}
                                                style={{ backgroundColor: (!registrationOpen || isSubmitting) ? '#9ca3af' : '#000000', color: '#ffffff' }}
                                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${(!registrationOpen || isSubmitting) ? 'cursor-not-allowed' : ''}`
                                                }
                                            >
                                                {isSubmitting ? 'Memproses...' : 'Kirim Pendaftaran'}
                                            </button>
                                        </div>
                                    )}

                                </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>
        </>
    );
};

// Sub-components for cleaner code
const ErrorMsg = ({ msg }: { msg: string }) => (
    msg ? <p className="text-xs mt-1 text-red-600 font-medium flex items-center gap-1"><AlertCircle size={12} /> {msg}</p> : null
);

interface FileUploadProps {
    id: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileName: string;
    error: string;
    onRemove: () => void;
}

const FileUpload = ({ id, onChange, fileName, error, onRemove }: FileUploadProps) => (
    <div className="relative">
        <input type="file" id={id} onChange={onChange} accept=".jpg,.jpeg,.png,.pdf,image/*" className="hidden" />
        <label htmlFor={id} className={`w-full px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${error ? 'border-red-500 bg-red-50' : fileName ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}>
            <Upload size={24} className={error ? 'text-red-500' : fileName ? 'text-green-600' : 'text-gray-400'} />
            <span className={`text-sm font-medium ${error ? 'text-red-600' : fileName ? 'text-green-600' : 'text-gray-600'}`}>
                {fileName || 'Klik untuk upload file'}
            </span>
        </label>
        {fileName && !error && (
            <button type="button" onClick={onRemove} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border hover:bg-gray-100">
                <X size={14} className="text-red-500" />
            </button>
        )}
        <ErrorMsg msg={error} />
    </div>
);

export default Form;
