// pages/api/auto-generate.js
// Sederhana: baca cookies.json, pilih random, generate token
// Tanpa validasi, tanpa menulis file (read-only)

import fs from 'fs';
import path from 'path';

// =====================================================
// KONSTANTA
// =====================================================
const COOKIE_FILE = path.join(process.cwd(), 'data', 'cookies.json');
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

// =====================================================
// FUNGSI BACA FILE COOKIE (READ-ONLY)
// =====================================================
function readCookiesFile() {
  try {
    if (!fs.existsSync(COOKIE_FILE)) {
      return [];
    }
    const content = fs.readFileSync(COOKIE_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('[Read] Error:', error.message);
    return [];
  }
}

// =====================================================
// FUNGSI GENERATE TOKEN DARI COOKIE
// =====================================================
async function generateToken(cookieStr) {
  try {
    const url = new URL(API_URL);
    Object.entries(QUERY_PARAMS).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const headers = {
      ...BASE_HEADERS,
      Cookie: cookieStr.trim(),
    };

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const token = data?.value?.account?.token?.default?.token;

    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    const expires = data?.value?.account?.token?.default?.expires;
    let expiryDate = null;
    if (expires) {
      if (typeof expires === 'number' && expires.toString().length === 13) {
        expiryDate = new Date(expires);
      } else if (typeof expires === 'number') {
        expiryDate = new Date(expires * 1000);
      } else {
        expiryDate = new Date(expires);
      }
    }

    return {
      success: true,
      token,
      url: `https://netflix.com/?nftoken=${token}`,
      expiryHuman: expiryDate ? expiryDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : 'Tidak diketahui',
      profile: {
        country: data?.value?.account?.country || 'Tidak diketahui',
        plan: data?.value?.account?.plan || 'Tidak diketahui',
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// =====================================================
// HANDLER UTAMA
// =====================================================
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[Auto-Generate] ========================================');
  console.log('[Auto-Generate] Memulai proses generate...');

  try {
    // 1. Baca file cookie
    const cookies = readCookiesFile();
    if (cookies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tidak ada cookie tersedia. Tambahkan cookie di data/cookies.json',
      });
    }

    console.log(`[Auto-Generate] Total cookie: ${cookies.length}`);

    // 2. Pilih random dan coba generate (max 3x percobaan)
    let lastError = null;

    for (let attempt = 0; attempt < Math.min(3, cookies.length); attempt++) {
      try {
        const randomIndex = Math.floor(Math.random() * cookies.length);
        const selectedCookie = cookies[randomIndex];
        console.log(`[Auto-Generate] Percobaan ${attempt + 1}, menggunakan cookie #${randomIndex + 1}`);

        const result = await generateToken(selectedCookie);

        console.log('[Auto-Generate] ✅ Sukses!');
        console.log('[Auto-Generate] ========================================');

        return res.status(200).json({
          success: true,
          ...result,
        });
      } catch (error) {
        lastError = error;
        console.log(`[Auto-Generate] ❌ Percobaan ${attempt + 1} gagal: ${error.message}`);
        continue;
      }
    }

    // Jika semua percobaan gagal
    return res.status(500).json({
      success: false,
      error: `Gagal generate setelah ${Math.min(3, cookies.length)} percobaan. ${lastError?.message || ''}`,
    });
  } catch (error) {
    console.error('[Auto-Generate] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan server.',
    });
  }
}
