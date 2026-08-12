// pages/api/auto-generate.js
// Versi dengan debug dan perbaikan fallback

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// =====================================================
// 1. KONSTANTA SERVER
// =====================================================
const SERVERS = {
  server1: {
    name: 'Server 1 (Online - Unlimited)',
    source: 'nftools.aroshi.my.id',
    apiBase: 'http://nftools.aroshi.my.id',
    devices: ['premium', 'standard', 'basic'],
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
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TIMEOUT_MS = 12000; // Ditambah jadi 12 detik

// =====================================================
// 2. FUNGSI PENDUKUNG
// =====================================================
function solvePow(challenge, prefix = '0000', maxAttempts = 500000) {
  for (let n = 0; n < maxAttempts; n++) {
    const hash = crypto.createHash('sha256').update(challenge + n).digest('hex');
    if (hash.startsWith(prefix)) {
      return `${challenge}:${n}`;
    }
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

function getRandomDevice(devices) {
  return devices[Math.floor(Math.random() * devices.length)];
}

// =====================================================
// 3. FUNGSI KONVERSI COOKIE LOKAL (Server 2)
// =====================================================
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
  Object.entries(QUERY_PARAMS).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const headers = {
    ...BASE_HEADERS,
    Cookie: cookieStr.trim(),
  };

  const response = await fetch(url.toString(), { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const tokenData = data?.value?.account?.token?.default || {};
  const token = tokenData.token;
  const expires = tokenData.expires;

  if (!token) {
    throw new Error('Token tidak ditemukan');
  }

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

// =====================================================
// 4. FUNGSI GENERATE DARI SERVER 1 (dengan DEBUG)
// =====================================================
async function generateFromServer1(plan = null, maxRetries = 3) {
  const plans = ['premium', 'standard', 'basic'];
  const selectedPlan = plan || plans[Math.floor(Math.random() * plans.length)];

  console.log(`[Server 1] 🚀 Memulai generate dengan plan: ${selectedPlan}`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[Server 1] 📡 Attempt ${attempt + 1}/${maxRetries} - Membuat session baru...`);

      // 1. Buat session
      const sessionRes = await fetchWithTimeout(
        `${SERVERS.server1.apiBase}/api/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': DEFAULT_UA,
          },
          body: JSON.stringify({}),
        },
        8000
      );

      console.log(`[Server 1] Session response status: ${sessionRes.status}`);

      if (!sessionRes.ok) {
        const errorText = await sessionRes.text();
        console.log(`[Server 1] ❌ Session gagal: ${sessionRes.status} - ${errorText}`);
        throw new Error(`Session HTTP ${sessionRes.status}: ${errorText}`);
      }

      const sessionData = await sessionRes.json();
      console.log(`[Server 1] Session data:`, JSON.stringify(sessionData).slice(0, 200));

      if (!sessionData.success || !sessionData.token) {
        console.log(`[Server 1] ❌ Session token tidak valid`);
        throw new Error('Session token tidak valid');
      }

      const sessionToken = sessionData.token;
      console.log(`[Server 1] ✅ Session token didapat: ${sessionToken.slice(0, 30)}...`);

      // 2. Generate token
      console.log(`[Server 1] 🔑 Mencoba generate token dengan plan: ${selectedPlan}`);
      let genRes = await fetchWithTimeout(
        `${SERVERS.server1.apiBase}/api/random`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': DEFAULT_UA,
            'X-NFToken-Session': sessionToken,
          },
          body: JSON.stringify({ plan: selectedPlan }),
        },
        8000
      );

      console.log(`[Server 1] Generate response status: ${genRes.status}`);
      let genData = await genRes.json();
      console.log(`[Server 1] Generate response:`, JSON.stringify(genData).slice(0, 300));

      // 3. Jika diminta PoW
      if (genRes.status === 403 && genData.powChallenge) {
        console.log(`[Server 1] 🧩 PoW challenge detected, solving...`);
        const proof = solvePow(genData.powChallenge);
        if (!proof) {
          console.log(`[Server 1] ❌ Gagal menyelesaikan PoW`);
          throw new Error('Gagal menyelesaikan PoW');
        }
        console.log(`[Server 1] ✅ PoW solved: ${proof.slice(0, 30)}...`);

        genRes = await fetchWithTimeout(
          `${SERVERS.server1.apiBase}/api/random`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': DEFAULT_UA,
              'X-NFToken-Session': sessionToken,
              'X-PoW-Proof': proof,
            },
            body: JSON.stringify({ plan: selectedPlan }),
          },
          8000
        );
        genData = await genRes.json();
        console.log(`[Server 1] PoW retry response:`, JSON.stringify(genData).slice(0, 300));
      }

      // 4. Cek hasil
      if (genRes.ok && genData.success && genData.url) {
        console.log(`[Server 1] ✅ SUCCESS on attempt ${attempt + 1}!`);
        return {
          success: true,
          url: genData.url,
          expiry: genData.expires || 'Tidak diketahui',
          profile: {
            country: genData.country || 'Tidak diketahui',
            currency: genData.currency || 'Tidak diketahui',
            plan: genData.plan || genData.quality || selectedPlan,
            email: genData.email || 'Tidak diketahui',
          },
          device: selectedPlan,
          source: 'Server 1 (Online - Unlimited)',
        };
      }

      // 5. Jika gagal karena limit, coba lagi dengan session baru
      const errorMsg = genData.error || 'Unknown error';
      console.log(`[Server 1] ⚠️ Gagal: ${errorMsg}`);

      if (
        errorMsg.toLowerCase().includes('limit') ||
        errorMsg.toLowerCase().includes('harian') ||
        errorMsg.toLowerCase().includes('daily')
      ) {
        console.log(`[Server 1] 🔄 Limit detected, rotating session...`);
        continue;
      }

      // Error lain, lempar
      throw new Error(errorMsg);
    } catch (error) {
      console.log(`[Server 1] ❌ Attempt ${attempt + 1} failed: ${error.message}`);
      if (attempt === maxRetries - 1) {
        console.log(`[Server 1] 💀 Semua percobaan gagal.`);
        throw new Error(`Server 1 gagal setelah ${maxRetries} percobaan: ${error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }

  throw new Error('Server 1 gagal setelah semua percobaan');
}

// =====================================================
// 5. FUNGSI GENERATE DARI SERVER 2 (Lokal)
// =====================================================
async function generateFromServer2() {
  console.log(`[Server 2] 📂 Mencoba generate dari cookies.json lokal...`);

  const filePath = path.join(process.cwd(), 'data', 'cookies.json');

  if (!fs.existsSync(filePath)) {
    console.log(`[Server 2] ❌ File cookies.json tidak ditemukan di: ${filePath}`);
    throw new Error('File cookies.json tidak ditemukan.');
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const cookies = JSON.parse(fileContent);

  if (!Array.isArray(cookies) || cookies.length === 0) {
    console.log(`[Server 2] ❌ Tidak ada cookie di cookies.json`);
    throw new Error('Tidak ada cookie di cookies.json.');
  }

  console.log(`[Server 2] 📋 Total cookie: ${cookies.length}`);

  const shuffled = [...cookies].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    const cookieStr = shuffled[i];
    try {
      console.log(`[Server 2] 🔑 Mencoba cookie ${i + 1}/${shuffled.length}...`);
      const result = await convertLocalCookie(cookieStr);
      if (result.success) {
        console.log(`[Server 2] ✅ Success!`);
        return {
          success: true,
          url: result.data.url,
          expiry: result.data.expiryHuman,
          profile: result.data.profile,
          device: 'random',
          source: 'Server 2 (Lokal)',
        };
      }
    } catch (error) {
      console.log(`[Server 2] ❌ Cookie ${i + 1} gagal: ${error.message}`);
      continue;
    }
  }

  console.log(`[Server 2] 💀 Semua cookie lokal tidak aktif.`);
  throw new Error('Semua cookie lokal tidak aktif.');
}

// =====================================================
// 6. FUNGSI UTAMA HANDLER
// =====================================================
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let serverChoice = 'server1';
  let deviceChoice = null;

  if (req.method === 'GET') {
    serverChoice = req.query.server || 'server1';
    deviceChoice = req.query.device || null;
  } else {
    serverChoice = req.body?.server || 'server1';
    deviceChoice = req.body?.device || null;
  }

  const validServers = ['server1', 'server2'];
  if (!validServers.includes(serverChoice)) {
    return res.status(400).json({ error: 'Server tidak valid. Pilih: server1 atau server2.' });
  }

  console.log(`[Auto-Generate] ========================================`);
  console.log(`[Auto-Generate] 📌 Server dipilih: ${serverChoice} (${SERVERS[serverChoice].name})`);
  console.log(`[Auto-Generate] ========================================`);

  try {
    let result;

    switch (serverChoice) {
      case 'server1':
        result = await generateFromServer1(deviceChoice, 3);
        break;
      case 'server2':
        result = await generateFromServer2();
        break;
      default:
        throw new Error('Server tidak dikenal');
    }

    console.log(`[Auto-Generate] ✅ Berhasil! Source: ${result.source}`);
    return res.status(200).json({
      success: true,
      url: result.url,
      expiry: result.expiry,
      profile: result.profile,
      device: result.device,
      source: result.source,
      server: serverChoice,
    });
  } catch (error) {
    console.log(`[Auto-Generate] ❌ Error di ${serverChoice}: ${error.message}`);

    // Jika server 1 gagal, coba fallback ke server 2
    if (serverChoice === 'server1') {
      try {
        console.log(`[Auto-Generate] 🔄 Mencoba fallback ke Server 2 (Lokal)...`);
        const fallbackResult = await generateFromServer2();
        console.log(`[Auto-Generate] ✅ Fallback berhasil!`);
        return res.status(200).json({
          success: true,
          url: fallbackResult.url,
          expiry: fallbackResult.expiry,
          profile: fallbackResult.profile,
          device: fallbackResult.device,
          source: fallbackResult.source,
          server: 'server2',
          fallback: true,
          originalServer: 'server1',
        });
      } catch (fallbackError) {
        console.log(`[Auto-Generate] ❌ Fallback Server 2 gagal: ${fallbackError.message}`);
      }
    }

    return res.status(503).json({
      success: false,
      error: 'Semua server gagal. Coba lagi nanti.',
      details: error.message,
      server: serverChoice,
    });
  }
}
