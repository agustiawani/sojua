// pages/api/auto-generate.js
// Versi dengan 3 sumber: local, cloud1 (nftools), cloud2 (yogaxd)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// =====================================================
// KONSTANTA
// =====================================================
const TIMEOUT_MS = 10000;
const CLOUD1_API = 'http://nftools.aroshi.my.id';
const CLOUD2_API = 'https://yogaxd-netflix.vercel.app/api/proxy';
const DEVICES = ['desktop', 'mobile', 'smarttv'];

// =====================================================
// FUNGSI PENDUKUNG
// =====================================================
function solvePow(challenge, prefix = '0000', maxAttempts = 500000) {
  for (let n = 0; n < maxAttempts; n++) {
    const hash = crypto.createHash('sha256').update(challenge + n).digest('hex');
    if (hash.startsWith(prefix)) return `${challenge}:${n}`;
  }
  return null;
}

async function fetchWithTimeout(url, options = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// =====================================================
// SUMBER 1: LOKAL (cookies.json)
// =====================================================
async function convertLocalCookie(cookieStr) {
  // ... (sama seperti kode sebelumnya, saya singkat agar tidak terlalu panjang)
  // Asumsikan fungsi ini sama dengan yang sudah ada di file sebelumnya.
  // Untuk menghemat, saya tulis ulang di sini secara lengkap.
  const API_URL = 'https://ios.prod.ftl.netflix.com/iosui/user/15.48';
  const QUERY_PARAMS = {
    appVersion: '15.48.1',
    config: '{"gamesInTrailersEnabled":"false","isTrailersEvidenceEnabled":"false","cdsMyListSortEnabled":"true","kidsBillboardEnabled":"true","addHorizontalBoxArtToVideoSummariesEnabled":"false","skOverlayTestEnabled":"false","homeFeedTestTVMovieListsEnabled":"false","baselineOnIpadEnabled":"true","trailersVideoIdLoggingFixEnabled":"true","postPlayPreviewsEnabled":"false","bypassContextualAssetsEnabled":"false","roarEnabled":"false","useSeason1AltLabelEnabled":"false","disableCDSSearchPaginationSectionKinds":["searchVideoCarousel"],"cdsSearchHorizontalPaginationEnabled":"true","searchPreQueryGamesEnabled":"true","kidsMyListEnabled":"true","billboardEnabled":"true","useCDSGalleryEnabled":"true","contentWarningEnabled":"true","videosInPopularGamesEnabled":"true","avifFormatEnabled":"false","sharksEnabled":"true"}',
    device_type: 'NFAPPL-02-',
    esn: 'NFAPPL-02-IPHONE8%3D1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200',
    idiom: 'phone',
    iosVersion: '15.8.5',
    isTablet: 'false',
    languages: 'en-US',
    locale: 'en-US',
    maxDeviceWidth: '375',
    model: 'saget',
    modelType: 'IPHONE8-1',
    odpAware: 'true',
    path: '["account","token","default"]',
    pathFormat: 'graph',
    pixelDensity: '2.0',
    progressive: 'false',
    responseFormat: 'json',
  };

  const BASE_HEADERS = {
    'User-Agent': 'Argo/15.48.1 (iPhone; iOS 15.8.5; Scale/2.00)',
    'x-netflix.request.attempt': '1',
    'x-netflix.request.client.user.guid': 'A4CS633D7VCBPE2GPK2HL4EKOE',
    'x-netflix.context.profile-guid': 'A4CS633D7VCBPE2GPK2HL4EKOE',
    'x-netflix.request.routing': '{"path":"/nq/mobile/nqios/~15.48.0/user","control_tag":"iosui_argo"}',
    'x-netflix.context.app-version': '15.48.1',
    'x-netflix.argo.translated': 'true',
    'x-netflix.context.form-factor': 'phone',
    'x-netflix.context.sdk-version': '2012.4',
    'x-netflix.client.appversion': '15.48.1',
    'x-netflix.context.max-device-width': '375',
    'x-netflix.context.ab-tests': '',
    'x-netflix.tracing.cl.useractionid': '4DC655F2-9C3C-4343-8229-CA1B003C3053',
    'x-netflix.client.type': 'argo',
    'x-netflix.client.ftl.esn': 'NFAPPL-02-IPHONE8=1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200',
    'x-netflix.context.locales': 'en-US',
    'x-netflix.context.top-level-uuid': '90AFE39F-ADF1-4D8A-B33E-528730990FE3',
    'x-netflix.client.iosversion': '15.8.5',
    'accept-language': 'en-US;q=1',
    'x-netflix.argo.abtests': '',
    'x-netflix.context.os-version': '15.8.5',
    'x-netflix.request.client.context': '{"appState":"foreground"}',
    'x-netflix.context.ui-flavor': 'argo',
    'x-netflix.argo.nfnsm': '9',
    'x-netflix.context.pixel-density': '2.0',
    'x-netflix.request.toplevel.uuid': '90AFE39F-ADF1-4D8A-B33E-528730990FE3',
    'x-netflix.request.client.timezoneid': 'Asia/Dhaka',
  };

  const url = new URL(API_URL);
  Object.entries(QUERY_PARAMS).forEach(([key, value]) => url.searchParams.append(key, value));

  const headers = { ...BASE_HEADERS, Cookie: cookieStr.trim() };
  const response = await fetch(url.toString(), { method: 'GET', headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const tokenData = data?.value?.account?.token?.default || {};
  const token = tokenData.token;
  const expires = tokenData.expires;
  if (!token) throw new Error('Token tidak ditemukan');

  let expiryDate = null;
  if (expires) {
    if (typeof expires === 'number' && expires.toString().length === 13) expiryDate = new Date(expires);
    else if (typeof expires === 'number') expiryDate = new Date(expires * 1000);
    else expiryDate = new Date(expires);
  }

  let profileInfo = null;
  try {
    const profileUrl = new URL('https://ios.prod.ftl.netflix.com/iosui/profiles/current');
    profileUrl.searchParams.append('appVersion', '15.48.1');
    profileUrl.searchParams.append('esn', QUERY_PARAMS.esn);
    profileUrl.searchParams.append('model', 'saget');
    profileUrl.searchParams.append('modelType', 'IPHONE8-1');
    profileUrl.searchParams.append('device_type', 'NFAPPL-02-');
    profileUrl.searchParams.append('iosVersion', '15.8.5');
    const profileHeaders = { ...BASE_HEADERS, Cookie: cookieStr.trim() };
    const profileRes = await fetch(profileUrl.toString(), { method: 'GET', headers: profileHeaders });
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      const account = profileData?.value?.account;
      if (account) {
        profileInfo = {
          country: account.country || 'Tidak diketahui',
          currency: account.currency || 'Tidak diketahui',
          plan: account.plan || 'Tidak diketahui',
          email: account.email || 'Tidak diketahui',
        };
      }
    }
  } catch (_) {}

  return {
    success: true,
    data: {
      token,
      url: `https://netflix.com/?nftoken=${token}`,
      expiryHuman: expiryDate ? expiryDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Tidak diketahui',
      profile: profileInfo,
    },
  };
}

// =====================================================
// SUMBER 2: CLOUD1 (nftools.aroshi.my.id)
// =====================================================
async function fetchFromCloud1() {
  console.log('[Cloud1] Mencoba...');
  const sessionRes = await fetchWithTimeout(
    `${CLOUD1_API}/api/session`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({}),
    },
    8000
  );
  if (!sessionRes.ok) throw new Error(`Session HTTP ${sessionRes.status}`);
  const sessionData = await sessionRes.json();
  if (!sessionData.success || !sessionData.token) throw new Error('Session token tidak valid');

  const sessionToken = sessionData.token;
  const plans = ['premium', 'standard', 'basic'];
  const plan = plans[Math.floor(Math.random() * plans.length)];

  let genRes = await fetchWithTimeout(
    `${CLOUD1_API}/api/random`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'X-NFToken-Session': sessionToken,
      },
      body: JSON.stringify({ plan }),
    },
    8000
  );
  let genData = await genRes.json();

  if (genRes.status === 403 && genData.powChallenge) {
    const proof = solvePow(genData.powChallenge);
    if (!proof) throw new Error('Gagal menyelesaikan PoW');
    genRes = await fetchWithTimeout(
      `${CLOUD1_API}/api/random`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'X-NFToken-Session': sessionToken,
          'X-PoW-Proof': proof,
        },
        body: JSON.stringify({ plan }),
      },
      8000
    );
    genData = await genRes.json();
  }

  if (!genRes.ok || !genData.success || !genData.url) {
    throw new Error(genData.error || 'Gagal generate dari Cloud1');
  }

  return {
    url: genData.url,
    expiry: genData.expires || 'Tidak diketahui',
    profile: {
      country: genData.country || 'Tidak diketahui',
      currency: genData.currency || 'Tidak diketahui',
      plan: genData.plan || genData.quality || 'Tidak diketahui',
      email: genData.email || 'Tidak diketahui',
    },
  };
}

// =====================================================
// SUMBER 3: CLOUD2 (yogaxd-netflix.vercel.app)
// =====================================================
async function fetchFromCloud2() {
  console.log('[Cloud2] Mencoba...');
  const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
  const url = `${CLOUD2_API}?action=generate&device=${device}`;

  const response = await fetchWithTimeout(url, { method: 'GET' }, 10000);
  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try { const err = await response.json(); if (err.error) errMsg = err.error; } catch (_) {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  if (!data.url) {
    throw new Error(data.error || 'Gagal generate dari Cloud2');
  }

  const details = data.details || {};
  return {
    url: data.url,
    expiry: data.expires || 'Tidak diketahui',
    profile: {
      country: details.Country || 'Tidak diketahui',
      currency: details.Currency || 'Tidak diketahui',
      plan: details.Plan || 'Tidak diketahui',
      email: details.Email || 'Tidak diketahui',
    },
  };
}

// =====================================================
// HANDLER UTAMA
// =====================================================
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source = 'cloud1' } = req.query; // default cloud1

  try {
    let result;

    switch (source) {
      case 'local':
        // === SUMBER LOKAL ===
        console.log('[Auto-Generate] Source: LOCAL');
        const filePath = path.join(process.cwd(), 'data', 'cookies.json');
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'File cookies.json tidak ditemukan.' });
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const cookies = JSON.parse(fileContent);
        if (!Array.isArray(cookies) || cookies.length === 0) {
          return res.status(404).json({ error: 'Tidak ada cookie di cookies.json.' });
        }
        const shuffled = [...cookies].sort(() => Math.random() - 0.5);
        let found = false;
        for (const cookieStr of shuffled) {
          try {
            const conv = await convertLocalCookie(cookieStr);
            if (conv.success) {
              result = conv.data;
              found = true;
              break;
            }
          } catch (_) { continue; }
        }
        if (!found) {
          return res.status(404).json({ error: 'Semua cookie lokal tidak aktif.' });
        }
        break;

      case 'cloud2':
        // === SUMBER CLOUD2 (yogaxd) ===
        console.log('[Auto-Generate] Source: CLOUD2');
        result = await fetchFromCloud2();
        break;

      case 'cloud1':
      default:
        // === SUMBER CLOUD1 (nftools) ===
        console.log('[Auto-Generate] Source: CLOUD1');
        result = await fetchFromCloud1();
        break;
    }

    return res.status(200).json({
      success: true,
      url: result.url,
      expiry: result.expiry,
      profile: result.profile,
    });
  } catch (error) {
    console.error(`[Auto-Generate] Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: `Gagal: ${error.message}`,
    });
  }
}
