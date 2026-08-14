// pages/api/convert.js
// Endpoint untuk mengonversi cookie Netflix menjadi NFToken
// Mendukung 4 format input:
// 1. JSON Array: [{"name":"NetflixId","value":"xxx"}, ...]
// 2. JSON Object: {"NetflixId":"yyy", "SecureNetflixId":"www"}
// 3. Raw String: NetflixId=xxx; SecureNetflixId=yyy; ...
// 4. Netscape (.txt): baris dengan tab-separated

export default async function handler(req, res) {
  // =====================================================
  // 1. VALIDASI METHOD
  // =====================================================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // =====================================================
  // 2. AMBIL DAN VALIDASI INPUT
  // =====================================================
  let { cookie } = req.body;

  if (!cookie || typeof cookie !== 'string') {
    return res.status(400).json({ error: 'Cookie string is required' });
  }

  // =====================================================
  // 3. PARSING COOKIE (MENDETEKSI FORMAT)
  // =====================================================
  const parsedCookie = parseCookieInput(cookie);

  // Validasi setelah parsing
  if (!parsedCookie || !parsedCookie.includes('NetflixId=')) {
    return res.status(400).json({
      error: 'Cookie tidak valid: tidak ditemukan NetflixId setelah parsing.',
      hint: 'Pastikan cookie berisi NetflixId. Support format: JSON Array, JSON Object, Raw String, atau Netscape .txt',
    });
  }

  console.log('[Convert] Cookie berhasil diparse, panjang:', parsedCookie.length);

  // =====================================================
  // 4. KIRIM REQUEST KE API NETFLIX
  // =====================================================
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
    Cookie: parsedCookie,
  };

  try {
    // =====================================================
    // 5. DAPATKAN TOKEN
    // =====================================================
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorText = await response.text();
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (_) {}
      return res.status(response.status).json({
        error: `HTTP Error ${response.status}`,
        detail: errorJson || errorText,
      });
    }

    const data = await response.json();
    const tokenData = data?.value?.account?.token?.default || {};
    const token = tokenData.token;
    const expires = tokenData.expires;

    if (!token) {
      return res.status(200).json({
        success: false,
        message: 'Token tidak ditemukan. Cookie mungkin sudah kadaluarsa atau tidak valid.',
        debug: data,
      });
    }

    // =====================================================
    // 6. AMBIL INFORMASI PROFIL (COUNTRY, DLL)
    // =====================================================
    let profileInfo = null;
    try {
      const profileUrl = new URL('https://ios.prod.ftl.netflix.com/iosui/profiles/current');
      profileUrl.searchParams.append('appVersion', '15.48.1');
      profileUrl.searchParams.append('esn', QUERY_PARAMS.esn);
      profileUrl.searchParams.append('model', 'saget');
      profileUrl.searchParams.append('modelType', 'IPHONE8-1');
      profileUrl.searchParams.append('device_type', 'NFAPPL-02-');
      profileUrl.searchParams.append('iosVersion', '15.8.5');

      const profileHeaders = {
        ...BASE_HEADERS,
        Cookie: parsedCookie,
      };
      const profileRes = await fetch(profileUrl.toString(), {
        method: 'GET',
        headers: profileHeaders,
      });
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
    } catch (_) {
      // Abaikan jika gagal ambil profil
    }

    // =====================================================
    // 7. FORMAT EXPIRY
    // =====================================================
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

    // =====================================================
    // 8. KIRIM RESPONSE
    // =====================================================
    return res.status(200).json({
      success: true,
      token,
      url: `https://netflix.com/?nftoken=${token}`,
      expires: expiryDate ? expiryDate.toISOString() : null,
      expiryHuman: expiryDate
        ? expiryDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        : 'Tidak diketahui',
      profile: profileInfo,
    });
  } catch (error) {
    console.error('[Convert] Error:', error);
    return res.status(500).json({
      error: 'Terjadi kesalahan server',
      detail: error.message,
    });
  }
}

// =====================================================
// FUNGSI PARSING COOKIE (MENDETEKSI FORMAT)
// =====================================================
function parseCookieInput(rawInput) {
  // Bersihkan input
  const trimmed = rawInput.trim();

  // ===== 1. COBA PARSE SEBAGAI JSON =====
  try {
    const parsed = JSON.parse(trimmed);

    // 1a. JSON Array: [{"name":"NetflixId","value":"xxx"}, ...]
    if (Array.isArray(parsed)) {
      const cookieParts = parsed
        .filter((item) => item.name && item.value)
        .map((item) => `${item.name}=${item.value}`);
      if (cookieParts.length > 0) {
        console.log('[Parser] ✅ Detected JSON Array format');
        return cookieParts.join('; ');
      }
    }

    // 1b. JSON Object: {"NetflixId":"xxx", "SecureNetflixId":"yyy"}
    if (typeof parsed === 'object' && parsed !== null) {
      const cookieParts = Object.entries(parsed)
        .filter(([key]) => key.includes('NetflixId') || key.includes('SecureNetflixId') || key.includes('nfvdid') || key.includes('OptanonConsent'))
        .map(([key, value]) => `${key}=${value}`);
      if (cookieParts.length > 0) {
        console.log('[Parser] ✅ Detected JSON Object format');
        return cookieParts.join('; ');
      }
    }
  } catch (_) {
    // Bukan JSON, lanjut ke step berikutnya
  }

  // ===== 2. CEK APAKAH SUDAH FORMAT HTTP STRING =====
  if (trimmed.includes('NetflixId=') || trimmed.includes('SecureNetflixId=')) {
    console.log('[Parser] ✅ Detected Raw HTTP String format');
    return trimmed;
  }

  // ===== 3. COBA DETEKSI FORMAT NETSCAPE (.txt) =====
  const lines = trimmed.split('\n').filter((line) => line.trim() !== '');
  if (lines.length > 0 && lines[0].includes('\t') && lines[0].includes('.netflix.com')) {
    console.log('[Parser] ✅ Detected Netscape (.txt) format');
    const cookieParts = [];
    const requiredKeys = ['NetflixId', 'SecureNetflixId', 'nfvdid', 'OptanonConsent'];

    for (const line of lines) {
      const fields = line.split('\t');
      if (fields.length >= 7) {
        const name = fields[5].trim();
        const value = fields[6].trim();
        if (requiredKeys.includes(name)) {
          cookieParts.push(`${name}=${value}`);
        }
      }
    }

    if (cookieParts.length > 0) {
      return cookieParts.join('; ');
    }
  }

  // ===== 4. JIKA SEMUA GAGAL, RETURN INPUT APA ADANYA =====
  console.log('[Parser] ⚠️ Format tidak dikenali, return raw input');
  return trimmed;
}
