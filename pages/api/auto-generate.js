// pages/api/auto-generate.js
// Server 1: https://yogaxd-netflix.vercel.app (tanpa limit, support TV)
// Server 2: Lokal (cookies.json)

import fs from 'fs';
import path from 'path';

const SERVERS = {
  server1: {
    name: 'Server 1 (Online + TV)',
    source: 'yogaxd-netflix.vercel.app',
    apiBase: 'https://yogaxd-netflix.vercel.app/api/proxy',
    devices: ['desktop', 'mobile', 'smarttv'],
    type: 'online',
  },
  server2: {
    name: 'Server 2 (Lokal)',
    source: 'cookies.json',
    apiBase: null,
    devices: ['random'],
    type: 'local',
  },
};

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const TIMEOUT_MS = 10000;

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

// ===== FUNGSI KONVERSI COOKIE LOKAL (Server 2) =====
async function convertLocalCookie(cookieStr) {
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
  Object.entries(QUERY_PARAMS).forEach(([k, v]) => url.searchParams.append(k, v));
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
      device: 'random',
    },
  };
}

// ===== FUNGSI GENERATE DARI SERVER 1 (yogaxd) =====
async function generateFromServer1(device = null) {
  const devices = SERVERS.server1.devices;
  const selectedDevice = device || devices[Math.floor(Math.random() * devices.length)];
  const deviceAttempts = device ? [device] : devices;

  // Ambil cookie dari halaman utama
  let cookieString = '';
  try {
    const homeRes = await fetchWithTimeout(
      'https://yogaxd-netflix.vercel.app/',
      {
        method: 'GET',
        headers: {
          'User-Agent': DEFAULT_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      8000
    );
    const setCookie = homeRes.headers.get('set-cookie');
    if (setCookie) {
      const parts = setCookie.split(';')[0];
      if (parts) cookieString = parts;
    }
  } catch (e) {
    console.log('Gagal mengambil cookie dari halaman utama:', e.message);
  }

  for (const dev of deviceAttempts) {
    try {
      const url = `${SERVERS.server1.apiBase}?action=generate&device=${dev}`;
      const headers = {
        'User-Agent': DEFAULT_UA,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Origin': 'https://yogaxd-netflix.vercel.app',
        'Referer': 'https://yogaxd-netflix.vercel.app/',
      };
      if (cookieString) {
        headers['Cookie'] = cookieString;
      }
      const response = await fetchWithTimeout(url, { method: 'GET', headers }, 8000);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(`${data.error} - ${data.message || ''}`);
      }
      if (!data.url) {
        throw new Error('Token tidak ditemukan dalam respons');
      }
      const details = data.details || {};
      const token = data.url.split('nftoken=')[1] || '';

      return {
        success: true,
        url: data.url,
        expiry: data.expires || 'Tidak diketahui',
        profile: {
          country: details.Country || 'Tidak diketahui',
          currency: 'Tidak diketahui',
          plan: details.Plan || 'Standard',
          email: details.Email || 'Tidak diketahui',
          device: dev,
          profileName: details.Profile || 'Tidak diketahui',
          lastActive: details['Last Active'] || 'Tidak diketahui',
          billingDate: details['Billing Date'] || 'Tidak diketahui',
        },
        device: dev,
        source: 'Server 1 (Online + TV)',
      };
    } catch (error) {
      console.log(`[Server 1] Device ${dev} gagal: ${error.message}`);
      if (device) throw error;
    }
  }

  throw new Error('Server 1 gagal: semua device tidak berhasil');
}

// ===== FUNGSI GENERATE DARI SERVER 2 (Lokal) =====
async function generateFromServer2() {
  const filePath = path.join(process.cwd(), 'data', 'cookies.json');
  if (!fs.existsSync(filePath)) throw new Error('File cookies.json tidak ditemukan.');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const cookies = JSON.parse(fileContent);
  if (!Array.isArray(cookies) || cookies.length === 0) throw new Error('Tidak ada cookie di cookies.json.');
  const shuffled = [...cookies].sort(() => Math.random() - 0.5);
  for (const cookieStr of shuffled) {
    try {
      const result = await convertLocalCookie(cookieStr);
      if (result.success) {
        return {
          success: true,
          url: result.data.url,
          expiry: result.data.expiryHuman,
          profile: result.data.profile,
          device: 'random',
          source: 'Server 2 (Lokal)',
        };
      }
    } catch (_) {}
  }
  throw new Error('Semua cookie lokal tidak aktif.');
}

// ===== HANDLER UTAMA =====
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let serverChoice = req.method === 'GET' ? req.query.server : req.body?.server;
  serverChoice = serverChoice || 'server1';
  if (!['server1', 'server2'].includes(serverChoice)) {
    return res.status(400).json({ error: 'Server tidak valid.' });
  }
  console.log(`[Auto-Generate] Server dipilih: ${serverChoice}`);

  try {
    if (serverChoice === 'server1') {
      const result = await generateFromServer1();
      return res.status(200).json({ success: true, ...result, server: 'server1' });
    } else {
      const result = await generateFromServer2();
      return res.status(200).json({ success: true, ...result, server: 'server2' });
    }
  } catch (error) {
    if (serverChoice === 'server1') {
      console.log('[Auto-Generate] Server 1 gagal, fallback ke Server 2');
      try {
        const fallbackResult = await generateFromServer2();
        return res.status(200).json({
          success: true,
          ...fallbackResult,
          server: 'server2',
          fallback: true,
          reason: 'Server 1 sedang bermasalah. Menggunakan Server 2 (Lokal).',
        });
      } catch (fallbackError) {
        return res.status(503).json({
          success: false,
          error: 'Server 1 dan Server 2 gagal.',
          details: fallbackError.message,
        });
      }
    }
    return res.status(503).json({
      success: false,
      error: error.message || 'Terjadi kesalahan.',
    });
  }
}
