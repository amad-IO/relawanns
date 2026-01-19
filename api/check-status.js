// Mock API for local development
// Returns hardcoded status - replace with real API call in production

export default async function handler(req, res) {
  // Simple mock response for local dev
  // In production (Vercel), this will be replaced by actual serverless function

  return res.status(200).json({
    success: true,
    data: {
      isOpen: false, // Change this manually for testing: true = open, false = closed
      message: 'Pendaftaran ditutup',
      description: 'Bergabung dengan Relawanns dan wujudkan perubahan nyata untuk Indonesia',
    },
  });
}
