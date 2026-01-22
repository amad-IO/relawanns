import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Upload, X, Clock } from 'lucide-react';
import ValidationDialog from './ValidationDialog';
import { compressImage } from '../utils/imageCompression';

const Form = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        city: '',
        paymentProof: null as File | null
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Mengirim...');
    const [fileName, setFileName] = useState('');
    const [fileError, setFileError] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        city: ''
    });

    // Registration status from API
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [statusLoading, setStatusLoading] = useState(true);

    // Fetch registration status
    React.useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/check-status');
                const result = await response.json();
                if (result.success) {
                    setRegistrationOpen(result.data.isOpen);
                }
            } catch (error) {
                console.error('Failed to fetch registration status:', error);
                setRegistrationOpen(false); // Fail-safe: close on error
            } finally {
                setStatusLoading(false);
            }
        };

        fetchStatus();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // Sanitize input to prevent XSS and SQL injection
    // NOTE: Runs only on submission to prevent input lag
    const sanitizeInput = (input: string): string => {
        if (!input) return '';

        let sanitized = input;

        // Remove script tags
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove other HTML tags but preserve content
        sanitized = sanitized.replace(/<[^>]*>/g, '');

        // Remove SQL injection patterns (common keywords in malicious context)
        sanitized = sanitized.replace(/(\bSELECT\b.*\bFROM\b)/gi, '');
        sanitized = sanitized.replace(/(\bINSERT\b.*\bINTO\b)/gi, '');
        sanitized = sanitized.replace(/(\bUPDATE\b.*\bSET\b)/gi, '');
        sanitized = sanitized.replace(/(\bDELETE\b.*\bFROM\b)/gi, '');
        sanitized = sanitized.replace(/(\bDROP\b.*\bTABLE\b)/gi, '');

        // Remove semicolons that could be used for SQL injection
        sanitized = sanitized.replace(/;/g, '');

        return sanitized;
    };

    // Validate individual fields
    const validateField = (name: string, value: string): string => {
        let error = '';

        // Jangan validasi jika field kosong (kecuali untuk submit)
        if (!value || value.trim() === '') {
            return '';
        }

        switch (name) {
            case 'name':
                // Hanya huruf, spasi, dan titik
                if (!/^[a-zA-Z\s.]+$/.test(value)) {
                    error = 'Nama lengkap tidak valid';
                } else if (value.length < 3) {
                    error = 'Nama lengkap tidak valid';
                } else if (value.length > 50) {
                    error = 'Nama lengkap tidak valid';
                }
                break;
            case 'email':
                // Validasi email dengan regex ketat
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                    error = 'Email tidak valid';
                }
                break;
            case 'phone':
                // WhatsApp: 08 atau 62, panjang 10-15 digit
                if (!/^(08|62)\d{8,13}$/.test(value)) {
                    error = 'Nomor WhatsApp tidak valid (awali dengan 08 atau 62)';
                }
                break;
            case 'age':
                const ageNum = parseInt(value);
                // Usia 17-60 tahun
                if (isNaN(ageNum) || ageNum < 17 || ageNum > 60) {
                    error = 'Usia tidak valid (17-60)';
                }
                break;
            case 'city':
                // Hanya huruf dan spasi, max 30 karakter
                if (!/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'Kota domisili tidak valid';
                } else if (value.length > 30) {
                    error = 'Kota domisili tidak valid';
                }
                break;
        }

        return error;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const errors = {
            name: validateField('name', formData.name),
            email: validateField('email', formData.email),
            phone: validateField('phone', formData.phone),
            age: validateField('age', formData.age),
            city: validateField('city', formData.city)
        };

        setValidationErrors(errors);

        // Check if there are any errors
        if (Object.values(errors).some(error => error !== '')) {
            return;
        }

        if (!formData.paymentProof) {
            setFileError('Bukti pembayaran wajib diunggah');
            return;
        }

        // Show confirmation dialog instead of submitting directly
        setShowDialog(true);
    };

    // Final submit after user confirms
    const handleConfirmSubmit = async () => {
        setShowDialog(false);
        setIsSubmitting(true);
        setStatusMessage('Memproses...');

        try {
            // 1. Sanitize data before sending (moved from handleChange to here)
            const cleanData = {
                name: sanitizeInput(formData.name),
                email: sanitizeInput(formData.email),
                phone: sanitizeInput(formData.phone),
                age: sanitizeInput(formData.age),
                city: sanitizeInput(formData.city)
            };

            // 2. Refresh validation on sanitized data
            const errors = {
                name: validateField('name', cleanData.name),
                email: validateField('email', cleanData.email),
                phone: validateField('phone', cleanData.phone),
                age: validateField('age', cleanData.age),
                city: validateField('city', cleanData.city)
            };

            if (Object.values(errors).some(error => error !== '')) {
                setValidationErrors(errors);
                throw new Error('Validasi gagal. Silakan periksa kembali data Anda.');
            }

            // 3. Compress image if exists
            let fileToUpload = formData.paymentProof;
            if (fileToUpload) {
                setStatusMessage('Mengompres...');
                try {
                    // Compress to max 1MB
                    fileToUpload = await compressImage(fileToUpload, 1);
                } catch (err) {
                    console.warn('Compression failed, using original file', err);
                }
            }

            setStatusMessage('Mengirim...');

            // 4. Prepare form data for API
            const submitData = new FormData();
            submitData.append('name', cleanData.name);
            submitData.append('email', cleanData.email);
            submitData.append('phone', cleanData.phone);
            submitData.append('age', cleanData.age);
            submitData.append('city', cleanData.city);
            if (fileToUpload) {
                submitData.append('paymentProof', fileToUpload);
            }

            // Call serverless API
            const response = await fetch('/.netlify/functions/register', {
                method: 'POST',
                body: submitData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Terjadi kesalahan saat mendaftar');
            }

            // Show success state
            setIsSubmitted(true);
            setIsSubmitting(false);

            // Reset form after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    age: '',
                    city: '',
                    paymentProof: null
                });
                setFileName('');
                setFileError('');
                setValidationErrors({
                    name: '',
                    email: '',
                    phone: '',
                    age: '',
                    city: ''
                });
            }, 3000);
        } catch (error: unknown) {
            console.error('Submission error:', error);
            setIsSubmitting(false);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.';
            alert(errorMessage);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Performance fix: REMOVED sanitizeInput from here.
        // It runs only on submit now to prevent input lag.

        setFormData({
            ...formData,
            [name]: value
        });

        // Validasi real-time saat user mengetik
        const error = validateField(name, value);
        setValidationErrors({
            ...validationErrors,
            [name]: error
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        // Reset state
        setFileError('');
        setFileName('');
        setFormData({
            ...formData,
            paymentProof: null
        });

        // 1. Validasi ekstensi file (ekstraksi yang benar)
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        const fileNameLower = file.name.toLowerCase();
        const extension = fileNameLower.split('.').pop();

        if (!extension || !allowedExtensions.includes(extension)) {
            setFileError('Hanya file JPG, PNG, atau PDF yang diperbolehkan');
            e.target.value = ''; // Reset input file
            return;
        }

        // 2. Check double extension berbahaya (e.g., .jpg.php, .png.exe)
        // Ambil 2 ekstensi terakhir untuk deteksi
        const filenameParts = file.name.split('.');
        if (filenameParts.length >= 2) {
            const lastTwoExtensions = filenameParts.slice(-2).join('.').toLowerCase();
            const dangerousPatterns = [
                '.php', '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs',
                '.js', '.jar', '.sh', '.app', '.msi', '.dll'
            ];

            // Cek apakah ada ekstensi berbahaya sebelum ekstensi yang valid
            const secondLastExtension = filenameParts.length > 2 ? '.' + filenameParts[filenameParts.length - 2].toLowerCase() : '';
            if (dangerousPatterns.includes(secondLastExtension)) {
                setFileError('Nama file tidak valid (terdeteksi ekstensi berbahaya)');
                e.target.value = ''; // Reset input file
                return;
            }
        }

        // 3. Validasi MIME type (strict - hanya yang valid)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedMimeTypes.includes(file.type)) {
            setFileError('Tipe file tidak valid. Gunakan JPG, PNG, atau PDF asli');
            e.target.value = ''; // Reset input file
            return;
        }

        // 4. Cross-check: pastikan ekstensi sesuai dengan MIME type
        const mimeExtensionMap: { [key: string]: string[] } = {
            'image/jpeg': ['jpg', 'jpeg'],
            'image/png': ['png'],
            'application/pdf': ['pdf']
        };

        const expectedExtensions = mimeExtensionMap[file.type];
        if (!expectedExtensions || !expectedExtensions.includes(extension)) {
            setFileError('Ekstensi file tidak sesuai dengan tipe file');
            e.target.value = ''; // Reset input file
            return;
        }

        // 5. Validasi ukuran file (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            setFileError(`Ukuran file terlalu besar (${fileSizeMB}MB). Maksimal 5MB`);
            e.target.value = ''; // Reset input file
            return;
        }

        // 6. Validasi ukuran minimum (cegah file kosong/corrupt)
        const minSize = 1024; // 1KB minimum
        if (file.size < minSize) {
            setFileError('File terlalu kecil atau rusak');
            e.target.value = ''; // Reset input file
            return;
        }

        // 7. Validasi nama file (cegah karakter berbahaya)
        const dangerousChars = /[<>:"|?*\x00-\x1f]/;
        if (dangerousChars.test(file.name)) {
            setFileError('Nama file mengandung karakter tidak valid');
            e.target.value = ''; // Reset input file
            return;
        }

        // Semua validasi lolos - simpan file
        setFormData({
            ...formData,
            paymentProof: file
        });
        setFileName(file.name);
    };

    const handleRemoveFile = () => {
        // Reset file input
        const fileInput = document.getElementById('paymentProof') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }

        // Reset state
        setFormData({
            ...formData,
            paymentProof: null
        });
        setFileName('');
        setFileError('');
    };

    return (
        <>
            {/* Validation Dialog - Rendered at top level */}
            <ValidationDialog
                isOpen={showDialog}
                onConfirm={handleConfirmSubmit}
                onCancel={() => setShowDialog(false)}
            />

            <section className="py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="container-custom">
                    <div className="max-w-2xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="mb-4">Daftar Sebagai Relawan</h2>
                            <p className="text-lg text-[--color-secondary]">
                                Isi formulir di bawah ini untuk bergabung dengan kami
                            </p>
                        </motion.div>

                        {/* Form Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-3xl shadow-xl p-8 md:p-10"
                        >
                            {isSubmitted ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={40} className="text-green-600" />
                                    </div>
                                    <h3 className="mb-3">Pendaftaran Berhasil!</h3>
                                    <p className="text-[--color-secondary]">
                                        Tim kami akan menghubungi Anda dalam 3-5 hari kerja
                                    </p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent transition-all text-black placeholder:text-gray-400 ${validationErrors.name ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="Masukkan nama lengkap"
                                        />
                                        {validationErrors.name && (
                                            <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>{validationErrors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent transition-all text-black placeholder:text-gray-400 ${validationErrors.email ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="email@example.com"
                                        />
                                        {validationErrors.email && (
                                            <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>{validationErrors.email}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                                            No. WhatsApp <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent transition-all text-black placeholder:text-gray-400 ${validationErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                        {validationErrors.phone && (
                                            <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>{validationErrors.phone}</p>
                                        )}
                                    </div>

                                    {/* Age */}
                                    <div>
                                        <label htmlFor="age" className="block text-sm font-medium text-black mb-2">
                                            Usia <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            id="age"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            required
                                            min="17"
                                            max="60"
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent transition-all text-black placeholder:text-gray-400 ${validationErrors.age ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="17"
                                        />
                                        {validationErrors.age && (
                                            <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>{validationErrors.age}</p>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-black mb-2">
                                            Kota Domisili <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent transition-all text-black placeholder:text-gray-400 ${validationErrors.city ? 'border-red-500' : 'border-gray-200'}`}
                                            placeholder="Jakarta"
                                        />
                                        {validationErrors.city && (
                                            <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>{validationErrors.city}</p>
                                        )}
                                    </div>

                                    {/* Payment Proof Upload */}
                                    <div>
                                        <label htmlFor="paymentProof" className="block text-sm font-medium text-black mb-2">
                                            Bukti Pembayaran <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="paymentProof"
                                                name="paymentProof"
                                                onChange={handleFileChange}
                                                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                                className="hidden"
                                            />
                                            <motion.label
                                                htmlFor="paymentProof"
                                                whileHover={{ scale: 1.01, borderColor: '#9ca3af' }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${fileError ? 'border-red-500 bg-red-50' : fileName ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}`}
                                            >
                                                <Upload size={20} className={fileError ? 'text-red-600' : fileName ? 'text-green-600' : 'text-black'} />
                                                <span className={`text-sm ${fileError ? 'text-red-600' : fileName ? 'text-green-600' : 'text-black'}`}>
                                                    {fileName || 'Upload Bukti Transfer'}
                                                </span>
                                            </motion.label>
                                        </div>
                                        {fileName && !fileError && (
                                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl mt-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={18} className="text-green-600" />
                                                    <span className="text-sm text-green-700">{fileName}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}
                                        {fileError && (
                                            <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>{fileError}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            Upload bukti transfer atau pembayaran dalam format JPG, PNG, atau PDF (maksimal 2MB)
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-center">
                                        {!registrationOpen && !statusLoading ? (
                                            <div className="w-full max-w-xs">
                                                <div className="py-4 px-6 rounded-xl font-semibold text-center bg-red-100 text-red-700 border-2 border-red-300">
                                                    Pendaftaran Ditutup
                                                </div>
                                                <p className="text-sm text-center text-gray-600 mt-3">
                                                    Pendaftaran saat ini sedang ditutup. Silakan cek kembali nanti.
                                                </p>
                                            </div>
                                        ) : (
                                            <motion.button
                                                type="submit"
                                                disabled={isSubmitting || statusLoading || !registrationOpen}
                                                whileHover={!isSubmitting && registrationOpen && !statusLoading ? { scale: 1.02 } : undefined}
                                                whileTap={!isSubmitting && registrationOpen && !statusLoading ? { scale: 0.98 } : undefined}
                                                className={`w-full max-w-xs py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all ${(isSubmitting || statusLoading || !registrationOpen)
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-black hover:bg-gray-800 hover:shadow-xl'
                                                    } text-white`}
                                            >
                                                {statusLoading ? (
                                                    'Memuat...'
                                                ) : isSubmitting ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        {statusMessage}
                                                    </>
                                                ) : (
                                                    'Daftar'
                                                )}
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* Privacy Notice */}
                                    <p className="text-xs text-center text-[--color-secondary] mt-4">
                                        Data Anda akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan pendaftaran relawan
                                    </p>
                                </form>
                            )}
                        </motion.div>

                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="mt-8 bg-blue-50 rounded-2xl p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Proses Selanjutnya</h4>
                                    <p className="text-sm text-[--color-secondary]">
                                        Setelah mendaftar, tim kami akan memverifikasi data Anda dan mengundang Anda ke grub WhatsApp. pastikan nomor yang anda masukkan benar.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Form;
