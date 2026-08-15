// pages/api/parse-netscape.js
// Konversi Netscape (.txt) ke Raw Cookie String

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { netscape } = req.body;
  if (!netscape || typeof netscape !== 'string') {
    return res.status(400).json({ error: 'Netscape text required' });
  }

  const trimmed = netscape.trim();
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  // Deteksi apakah ini format Netscape (ada tab dan .netflix.com)
  const isNetscape = lines.some(l => l.includes('\t') && l.includes('.netflix.com'));
  if (!isNetscape) {
    return res.status(400).json({ error: 'Format tidak dikenali sebagai Netscape.' });
  }

  const requiredKeys = ['NetflixId', 'SecureNetflixId', 'nfvdid', 'OptanonConsent'];
  const cookieParts = [];

  for (const line of lines) {
    const fields = line.split('\t');
    if (fields.length >= 7) {
      const name = fields[5].trim();
      const value = fields[6].trim();
      if (requiredKeys.includes(name) && value) {
        cookieParts.push(`${name}=${value}`);
      }
    }
  }

  if (cookieParts.length === 0) {
    return res.status(400).json({ error: 'Tidak ditemukan cookie yang dibutuhkan (NetflixId, SecureNetflixId, dll).' });
  }

  const rawCookie = cookieParts.join('; ');
  return res.status(200).json({ rawCookie });
}
