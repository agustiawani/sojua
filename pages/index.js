// pages/index.js

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  // ===== STATE UMUM =====
  const [activeTab, setActiveTab] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ===== STATE UNTUK CONVERTER =====
  const [cookieInput, setCookieInput] = useState('');

  // ===== STATE UNTUK SAVED COOKIES (Converter) =====
  const [savedCookies, setSavedCookies] = useState([]);
  const [newCookieName, setNewCookieName] = useState('');

  // ===== STATE UNTUK AUTO GENERATE =====
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenResult, setAutoGenResult] = useState(null);
  const [autoGenError, setAutoGenError] = useState('');

  // ===== STATE UNTUK NETSCAPE CONVERTER =====
  const [netscapeInput, setNetscapeInput] = useState('');
  const [netscapeLoading, setNetscapeLoading] = useState(false);
  const [netscapeError, setNetscapeError] = useState('');
  const [rawCookieResult, setRawCookieResult] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState(null);

  // ===== TOAST NOTIFICATION =====
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // ===== LOAD DARI LOCALSTORAGE (Converter) =====
  useEffect(() => {
    const stored = localStorage.getItem('netflix_cookies');
    if (stored) {
      try {
        setSavedCookies(JSON.parse(stored));
      } catch (_) {}
    }
  }, []);

  const updateSavedCookies = (newList) => {
    setSavedCookies(newList);
    localStorage.setItem('netflix_cookies', JSON.stringify(newList));
  };

  // ===== FUNGSI SIMPAN COOKIE =====
  const handleSaveCookie = () => {
    if (!newCookieName.trim()) {
      showToast('Berikan nama untuk akun ini', 'error');
      return;
    }
    if (!cookieInput.trim() || !cookieInput.includes('NetflixId=')) {
      showToast('Cookie tidak valid. Pastikan berisi NetflixId.', 'error');
      return;
    }
    if (savedCookies.some((c) => c.name.toLowerCase() === newCookieName.trim().toLowerCase())) {
      showToast(`Nama "${newCookieName}" sudah digunakan.`, 'error');
      return;
    }
    const newEntry = {
      id: Date.now().toString(),
      name: newCookieName.trim(),
      cookie: cookieInput.trim(),
    };
    updateSavedCookies([...savedCookies, newEntry]);
    setNewCookieName('');
    showToast(`✅ Cookie "${newCookieName}" berhasil disimpan!`, 'success');
  };

  const handleDeleteCookie = (id) => {
    if (confirm('Hapus cookie ini?')) {
      const newList = savedCookies.filter((c) => c.id !== id);
      updateSavedCookies(newList);
      showToast('Cookie berhasil dihapus', 'success');
    }
  };

  // ===== FUNGSI PANGGIL API CONVERT =====
  const callConvertApi = async (cookieStr) => {
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: cookieStr.trim() }),
      });
      const data = await res.json();
      return { success: res.ok && data.success, data };
    } catch (_) {
      return { success: false, data: null };
    }
  };

  // ===== CONVERTER =====
  const handleConverterSubmit = async (e) => {
    e.preventDefault();
    if (!cookieInput.trim() || !cookieInput.includes('NetflixId=')) {
      showToast('Cookie tidak valid. Pastikan berisi NetflixId.', 'error');
      return;
    }
    setActiveTab('converter');
    setResult(null);
    setError('');
    setLoading(true);
    const result = await callConvertApi(cookieInput);
    setLoading(false);
    if (result.success) {
      setResult(result.data);
      showToast('✅ Token berhasil di-generate!', 'success');
    } else {
      const errMsg = result.data?.error || 'Gagal mengonversi cookie';
      setError(errMsg);
      showToast(`❌ ${errMsg}`, 'error');
    }
  };

  // ===== AUTO GENERATE (3 Link Sekaligus) =====
  const handleAutoGenerate = async () => {
    setAutoGenLoading(true);
    setAutoGenError('');
    setAutoGenResult(null);

    try {
      const res = await fetch('/api/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAutoGenResult(data);
        showToast('✅ 3 link berhasil di-generate!', 'success');
      } else {
        const errMsg = data.error || 'Gagal menghasilkan link.';
        setAutoGenError(errMsg);
        showToast(`❌ ${errMsg}`, 'error');
      }
    } catch (_) {
      const errMsg = 'Terjadi kesalahan jaringan.';
      setAutoGenError(errMsg);
      showToast(`❌ ${errMsg}`, 'error');
    } finally {
      setAutoGenLoading(false);
    }
  };

  // ===== NETSCAPE CONVERTER =====
  const handleParseNetscape = async () => {
    setNetscapeLoading(true);
    setNetscapeError('');
    setRawCookieResult('');
    setTokenResult(null);
    try {
      const res = await fetch('/api/parse-netscape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ netscape: netscapeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRawCookieResult(data.rawCookie);
        showToast('✅ Raw Cookie berhasil diparse!', 'success');
      } else {
        const errMsg = data.error || 'Gagal parsing Netscape.';
        setNetscapeError(errMsg);
        showToast(`❌ ${errMsg}`, 'error');
      }
    } catch (_) {
      const errMsg = 'Terjadi kesalahan jaringan.';
      setNetscapeError(errMsg);
      showToast(`❌ ${errMsg}`, 'error');
    } finally {
      setNetscapeLoading(false);
    }
  };

  const handleGenerateFromRaw = async () => {
    if (!rawCookieResult) return;
    setTokenLoading(true);
    setTokenResult(null);
    setNetscapeError('');
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: rawCookieResult }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTokenResult(data);
        showToast('✅ NFToken berhasil di-generate!', 'success');
      } else {
        const errMsg = data.error || data.message || 'Gagal generate token.';
        setNetscapeError(errMsg);
        showToast(`❌ ${errMsg}`, 'error');
      }
    } catch (_) {
      const errMsg = 'Gagal generate token.';
      setNetscapeError(errMsg);
      showToast(`❌ ${errMsg}`, 'error');
    } finally {
      setTokenLoading(false);
    }
  };

  // ===== COPY TO CLIPBOARD (dengan Toast) =====
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`✅ ${label} disalin ke clipboard!`, 'success');
  };

  // ===== RENDER =====
  return (
    <>
      <Head>
        <title>NFTOKEN - Netflix Cookie Converter</title>
        <meta name="description" content="Konversi cookie Netflix menjadi link NFToken." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ✅ MAIN LANDMARK untuk aksesibilitas */}
      <main id="main-content" className="container" role="main">
        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        )}

        {/* HEADER */}
        <header>
          <div className="logo">
            <span className="logo-icon">▶</span>
            <span className="logo-text">NFTOKEN</span>
          </div>
          <span className="tagline">AUTO GENERATOR</span>
        </header>

        {/* TABS */}
        <div className="tabs" role="tablist">
          <button
            className={`tab ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto')}
            role="tab"
            aria-selected={activeTab === 'auto'}
            tabIndex={0}
          >
            <span className="tab-icon">⚡</span>
            <span className="tab-label">Generate</span>
          </button>
          <button
            className={`tab ${activeTab === 'converter' ? 'active' : ''}`}
            onClick={() => setActiveTab('converter')}
            role="tab"
            aria-selected={activeTab === 'converter'}
            tabIndex={0}
          >
            <span className="tab-icon">🔄</span>
            <span className="tab-label">Converter</span>
          </button>
          <button
            className={`tab ${activeTab === 'netscape' ? 'active' : ''}`}
            onClick={() => setActiveTab('netscape')}
            role="tab"
            aria-selected={activeTab === 'netscape'}
            tabIndex={0}
          >
            <span className="tab-icon">📄</span>
            <span className="tab-label">Netscape</span>
          </button>
          <button
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
            role="tab"
            aria-selected={activeTab === 'info'}
            tabIndex={0}
          >
            <span className="tab-icon">📖</span>
            <span className="tab-label">Info</span>
          </button>
        </div>

        {/* ============================================ */}
        {/* TAB: AUTO GENERATE (3 Link) */}
        {/* ============================================ */}
        {activeTab === 'auto' && (
          <div className="tab-content">
            <div className="section-label">⚡ GENERATE Link NFToken</div>
            <p className="hint">
              Klik tombol di bawah untuk mendapatkan link NFToken Support PC, Android, TV
            </p>

            <div className="auto-generate-area">
              <button
                className="btn-generate-auto"
                onClick={handleAutoGenerate}
                disabled={autoGenLoading}
              >
                {autoGenLoading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Memproses...</span>
                  </>
                ) : (
                  '⚡ Generate'
                )}
              </button>
              {autoGenError && (
                <div className="error-box">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{autoGenError}</span>
                </div>
              )}
            </div>

            {autoGenResult && (
              <div className="result-box">
                <div className="result-header">
                  <span className="result-badge">✅ SUKSES!</span>
                </div>

                <div className="result-item">
                  <span className="result-label">⏰ KADALUARSA</span>
                  <span className="result-value">{autoGenResult.expiry}</span>
                </div>

                {autoGenResult.profile && (
                  <div className="profile-mini">
                    <span>🌍 {autoGenResult.profile.country}</span>
                    <span>📦 {autoGenResult.profile.plan}</span>
                  </div>
                )}

                <div className="result-divider"></div>

                {/* 3 LINK CARD */}
                <div className="links-grid">
                  {/* PC */}
                  <div className="link-card">
                    <div className="link-card-header">🖥️ PC / Browser</div>
                    <a href={autoGenResult.links.pc} target="_blank" rel="noopener noreferrer" className="link-card-url">
                      {autoGenResult.links.pc}
                    </a>
                    <button onClick={() => copyToClipboard(autoGenResult.links.pc, 'Link PC')} className="link-card-copy">
                      📋 Salin
                    </button>
                  </div>

                  {/* Android */}
                  <div className="link-card">
                    <div className="link-card-header">📱 Android</div>
                    <a href={autoGenResult.links.android} target="_blank" rel="noopener noreferrer" className="link-card-url">
                      {autoGenResult.links.android}
                    </a>
                    <button onClick={() => copyToClipboard(autoGenResult.links.android, 'Link Android')} className="link-card-copy">
                      📋 Salin
                    </button>
                  </div>

                  {/* TV */}
                  <div className="link-card">
                    <div className="link-card-header">📺 TV</div>
                    <a href={autoGenResult.links.tv} target="_blank" rel="noopener noreferrer" className="link-card-url">
                      {autoGenResult.links.tv}
                    </a>
                    <button onClick={() => copyToClipboard(autoGenResult.links.tv, 'Link TV')} className="link-card-copy">
                      📋 Salin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: CONVERTER (Manual) */}
        {/* ============================================ */}
        {activeTab === 'converter' && (
          <div className="tab-content">
            <div className="section-label">RAW COOKIES</div>
            <div className="char-counter">{cookieInput.length} CHARS</div>

            {savedCookies.length > 0 && (
              <div className="saved-section">
                <div className="saved-list">
                  {savedCookies.map((item) => (
                    <div key={item.id} className="saved-item">
                      <span className="saved-name" onClick={() => setCookieInput(item.cookie)}>
                        {item.name}
                      </span>
                      <button onClick={() => setCookieInput(item.cookie)} className="btn-use" title="Gunakan">
                        📋
                      </button>
                      <button onClick={() => handleDeleteCookie(item.id)} className="btn-delete" title="Hapus">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleConverterSubmit}>
              <textarea
                rows={6}
                placeholder="Paste cookie disini. Support 3 format:&#10;1. JSON Array: [{'name':'NetflixId','value':'xxx'}]&#10;2. JSON Object: {'NetflixId':'yyy'}&#10;3. String: NetflixId=xxx; SecureNetflixId=yyy"
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                disabled={loading}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
              />

              <div className="form-actions">
                <div className="save-section">
                  <input
                    type="text"
                    placeholder="Nama akun (contoh: Akun Pribadi)"
                    value={newCookieName}
                    onChange={(e) => setNewCookieName(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleSaveCookie}
                    disabled={loading || !cookieInput.trim() || !newCookieName.trim()}
                    className="btn-save"
                  >
                    💾 Simpan
                  </button>
                </div>
                <button type="submit" disabled={loading || !cookieInput.trim()} className="btn-forge">
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      <span>MEMPROSES...</span>
                    </>
                  ) : (
                    '⚡ FORGE TOKEN'
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="error-box">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
              </div>
            )}

            {result && (
              <div className="result-box converter-result">
                <div className="result-header">
                  <span className="result-badge">✅ SUKSES!</span>
                </div>

                <div className="result-item">
                  <span className="result-label">🔗 URL LOGIN</span>
                  <div className="result-value-wrap">
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="result-link">
                      {result.url}
                    </a>
                    <button onClick={() => copyToClipboard(result.url, 'Link')} className="copy-btn">
                      📋
                    </button>
                  </div>
                </div>

                <div className="result-item">
                  <span className="result-label">⏰ KADALUARSA</span>
                  <span className="result-value">{result.expiryHuman}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">🔑 TOKEN</span>
                  <div className="result-value-wrap">
                    <code className="result-token">{result.token}</code>
                    <button onClick={() => copyToClipboard(result.token, 'Token')} className="copy-btn">
                      📋
                    </button>
                  </div>
                </div>

                {result.profile && (
                  <>
                    <div className="result-divider"></div>
                    <div className="profile-grid">
                      <div className="profile-item">
                        <span className="profile-label">🌍 Negara</span>
                        <span className="profile-value">{result.profile.country}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">💰 Mata Uang</span>
                        <span className="profile-value">{result.profile.currency}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">📦 Paket</span>
                        <span className="profile-value">{result.profile.plan}</span>
                      </div>
                      <div className="profile-item">
                        <span className="profile-label">📧 Email</span>
                        <span className="profile-value">{result.profile.email}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: NETSCAPE CONVERTER */}
        {/* ============================================ */}
        {activeTab === 'netscape' && (
          <div className="tab-content">
            <div className="section-label">📄 NETSCAPE TO RAW CONVERTER</div>
            <p className="hint">
              Tempelkan cookie format Netscape (tab-separated) di bawah, lalu klik "Parse ke Raw".
            </p>

            <div className="netscape-converter">
              <textarea
                rows={6}
                placeholder="Tempel Netscape di sini..."
                value={netscapeInput}
                onChange={(e) => setNetscapeInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  color: '#eaeef2',
                  resize: 'vertical',
                }}
              />

              <div className="netscape-actions">
                <button
                  onClick={handleParseNetscape}
                  disabled={netscapeLoading}
                  className="btn-parse"
                >
                  {netscapeLoading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Parsing...</span>
                    </>
                  ) : (
                    '🔧 Parse ke Raw'
                  )}
                </button>
                {rawCookieResult && (
                  <button
                    onClick={handleGenerateFromRaw}
                    disabled={tokenLoading}
                    className="btn-generate-raw"
                  >
                    {tokenLoading ? (
                      <>
                        <span className="spinner"></span>
                        <span>Generating...</span>
                      </>
                    ) : (
                      '⚡ Generate NFToken'
                    )}
                  </button>
                )}
              </div>

              {rawCookieResult && (
                <div className="raw-result">
                  <div className="raw-result-header">
                    <span className="raw-label">✅ Raw Cookie berhasil:</span>
                    <button
                      onClick={() => copyToClipboard(rawCookieResult, 'Raw Cookie')}
                      className="raw-copy-btn"
                      title="Salin Raw Cookie"
                    >
                      📋 Salin
                    </button>
                  </div>
                  <code className="raw-cookie">{rawCookieResult}</code>
                </div>
              )}

              {netscapeError && (
                <div className="error-box">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{netscapeError}</span>
                </div>
              )}

              {tokenResult && (
                <div className="result-box" style={{ marginTop: '16px' }}>
                  <div className="result-header">
                    <span className="result-badge">✅ SUKSES!</span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">🔗 URL LOGIN</span>
                    <div className="result-value-wrap">
                      <a href={tokenResult.url} target="_blank" rel="noopener noreferrer" className="result-link">
                        {tokenResult.url}
                      </a>
                      <button onClick={() => copyToClipboard(tokenResult.url, 'Link')} className="copy-btn">
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="result-item">
                    <span className="result-label">⏰ KADALUARSA</span>
                    <span className="result-value">{tokenResult.expiryHuman}</span>
                  </div>

                  {tokenResult.profile && (
                    <>
                      <div className="result-divider"></div>
                      <div className="profile-grid">
                        <div className="profile-item">
                          <span className="profile-label">🌍 Negara</span>
                          <span className="profile-value">{tokenResult.profile.country}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">📦 Paket</span>
                          <span className="profile-value">{tokenResult.profile.plan}</span>
                        </div>
                        <div className="profile-item">
                          <span className="profile-label">📧 Email</span>
                          <span className="profile-value">{tokenResult.profile.email}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: INFO */}
        {/* ============================================ */}
        {activeTab === 'info' && (
          <div className="tab-content info-tab">
            <div className="section-label">📖 PANDUAN PENGGUNAAN</div>

            {/* NFToken Info */}
            <div className="info-card">
              <h3>🔑 Apa itu NFToken?</h3>
              <p>
                NFToken (Netflix Token) adalah tautan khusus yang memungkinkan akses instan ke akun Netflix
                tanpa perlu memasukkan email dan password. Cukup buka tautan di perangkat yang diinginkan,
                dan Anda akan langsung masuk ke akun Netflix.
              </p>
            </div>

            {/* Fitur */}
            <div className="info-card">
              <h3>⚡ Fitur yang Tersedia</h3>
              <div className="feature-grid">
                <div className="feature-item">
                  <span className="feature-icon">🚀</span>
                  <div>
                    <strong>Auto Generate</strong>
                    <p>Generate 3 link sekaligus (PC, Android, TV) dari cookie yang tersimpan.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔄</span>
                  <div>
                    <strong>Converter</strong>
                    <p>Konversi cookie manual (JSON, Object, Raw String) menjadi NFToken.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📄</span>
                  <div>
                    <strong>Netscape Converter</strong>
                    <p>Konversi cookie format Netscape (.txt) ke Raw Cookie, lalu generate token.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tutorial Cookie-Editor */}
            <div className="info-card tutorial-card">
              <h3>🍪 Cara Mendapatkan Cookie dengan Cookie-Editor</h3>
              <p className="tutorial-intro">
                Ikuti langkah-langkah di bawah ini untuk mengambil cookie Netflix menggunakan ekstensi 
                <strong> Cookie-Editor</strong> (tersedia untuk Chrome, Firefox, Edge, dan Kiwi Browser di Android).
              </p>

              <ol className="tutorial-steps">
                <li>
                  <strong>Instal Ekstensi Cookie-Editor</strong>
                  <p>Kunjungi toko ekstensi browser favorit Anda dan cari "Cookie-Editor", lalu instal.</p>
                  <ul className="tutorial-sublist">
                    <li>🔹 <a href="https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm" target="_blank" rel="noopener noreferrer">Chrome Web Store</a></li>
                    <li>🔹 <a href="https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/" target="_blank" rel="noopener noreferrer">Firefox Add-ons</a></li>
                    <li>🔹 <a href="https://microsoftedge.microsoft.com/addons/detail/cookieeditor/neaepmjnfjhnoanlcbpggdplloldpegl" target="_blank" rel="noopener noreferrer">Edge Add-ons</a></li>
                    <li>🔹 Android: Gunakan <strong>Kiwi Browser</strong> dan instal ekstensi dari Chrome Web Store</li>
                  </ul>
                </li>

                <li>
                  <strong>Login ke Netflix</strong>
                  <p>Buka <a href="https://www.netflix.com" target="_blank" rel="noopener noreferrer">netflix.com</a> dan login ke akun Anda.</p>
                </li>

                <li>
                  <strong>Buka Cookie-Editor</strong>
                  <p>Klik ikon ekstensi Cookie-Editor di toolbar browser. Anda akan melihat daftar semua cookie untuk situs Netflix.</p>
                </li>

                <li>
                  <strong>Ekspor Cookie</strong>
                  <p>Klik tombol <strong>"Export"</strong> (ikon panah ke bawah) dan pilih format:</p>
                  <ul className="tutorial-sublist">
                    <li>🔸 <strong>JSON</strong> → untuk digunakan di tab <strong>Converter</strong> (format JSON Array/Object)</li>
                    <li>🔸 <strong>Netscape</strong> → untuk digunakan di tab <strong>Netscape Converter</strong></li>
                    <li>🔸 <strong>Header String</strong> → untuk digunakan di tab <strong>Converter</strong> (format Raw String)</li>
                  </ul>
                </li>

                <li>
                  <strong>Salin dan Tempel ke NFTOKEN</strong>
                  <p>Buka <a href="https://nftoken.zone.id" target="_blank" rel="noopener noreferrer">nftoken.zone.id</a>, pilih tab yang sesuai, lalu tempelkan hasil ekspor.</p>
                </li>
              </ol>

              <div className="tutorial-tip">
                💡 <strong>Tips:</strong> Pastikan Anda masih dalam keadaan <strong>login</strong> saat mengekspor cookie. 
                Cookie yang sudah kadaluarsa tidak akan berfungsi.
              </div>
            </div>

            {/* Cara Pakai NFToken */}
            <div className="info-card">
              <h3>💻 Cara Menggunakan NFToken</h3>

              <div className="device-guide">
                <div className="device-item">
                  <span className="device-icon">💻</span>
                  <div>
                    <strong>PC / Browser</strong>
                    <p>Salin/Buka tautan PC di atas → tempel di browser → selesai!</p>
                  </div>
                </div>

                <div className="device-item">
                  <span className="device-icon">📱</span>
                  <div>
                    <strong>iPhone (iOS)</strong>
                    <p>Buka Safari → tempel tautan Android → ketuk "Buka"</p>
                    <p className="note">⚠️ <em>Jangan gunakan Chrome di iOS — Safari paling cocok untuk Netflix</em></p>
                  </div>
                </div>

                <div className="device-item">
                  <span className="device-icon">🤖</span>
                  <div>
                    <strong>Android</strong>
                    <p>Buka browser apa saja (Chrome/Samsung/Edge) → tempel tautan Android → selesai!</p>
                  </div>
                </div>

                <div className="device-item">
                  <span className="device-icon">📺</span>
                  <div>
                    <strong>Smart TV</strong>
                    <p>Buka aplikasi Netflix → Pengaturan → Masuk → masukkan kode 4 digit yang muncul di layar TV</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Peringatan */}
            <div className="info-card warning-card">
              <h3>⚠️ Catatan Penting</h3>
              <ul>
                <li>⏰ Tautan NFToken <strong>kedaluwarsa dalam ±1 jam</strong> — segera simpan selagi masih aktif!</li>
                <li>🔒 Jangan bagikan tautan NFToken ke orang lain — siapa pun yang memegang tautan bisa mengakses akun Anda.</li>
                <li>📱 Gunakan tautan sesuai perangkat agar pengalaman optimal.</li>
                <li>🔄 Jika tautan tidak berfungsi, generate ulang untuk mendapatkan tautan baru.</li>
              </ul>
            </div>

            {/* Footer Info */}
            <div className="info-footer">
              <p>Dibuat dengan ❤️</p>
              <p>© 2026 NFTOKEN</p>
            </div>
          </div>
        )}

        <footer>
          <p>© 2026 NFTOKEN</p>
        </footer>
      </main>

      {/* ===== STYLES ===== */}
      <style jsx>{`
        /* ===== RESET & GLOBAL ===== */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: #0a0a0f;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #eaeef2;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: clamp(12px, 3vw, 40px);
          margin: 0;
        }

        .container {
          max-width: 720px;
          width: 100%;
          background: rgba(18, 18, 30, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: clamp(20px, 3vw, 32px);
          padding: clamp(16px, 3vw, 36px) clamp(14px, 3vw, 32px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
          margin: 0 auto;
          transition: all 0.2s ease;
        }

        /* ===== TOAST NOTIFICATION ===== */
        .toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: clamp(14px, 1.6vw, 16px);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(18, 18, 30, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          animation: slideDown 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
          max-width: 90%;
          width: auto;
          min-width: 280px;
          justify-content: center;
        }

        .toast-success {
          border-left: 4px solid #10b981;
        }

        .toast-error {
          border-left: 4px solid #ef4444;
        }

        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .toast-message {
          color: #eaeef2;
          word-break: break-word;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @media (max-width: 480px) {
          .toast {
            top: 12px;
            padding: 12px 16px;
            min-width: 200px;
            font-size: 13px;
          }
        }

        /* ===== HEADER ===== */
        header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 8px 12px;
          margin-bottom: clamp(16px, 2.5vw, 28px);
          padding-bottom: clamp(12px, 1.5vw, 18px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-icon {
          font-size: clamp(20px, 3vw, 28px);
          color: #e50914;
          font-weight: 700;
        }

        .logo-text {
          font-size: clamp(18px, 3vw, 26px);
          font-weight: 700;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #e50914, #f5a623);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tagline {
          font-size: clamp(9px, 1.2vw, 12px);
          font-weight: 600;
          color: #9ca3af; /* ✅ Perbaikan kontras */
          letter-spacing: 2px;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.04);
          padding: 4px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        /* ===== TABS ===== */
        .tabs {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: clamp(20px, 3vw, 32px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          flex-wrap: wrap;
        }

        .tab {
          flex: 1;
          min-width: 60px;
          padding: 10px 8px;
          border: none;
          border-radius: 11px;
          background: transparent;
          color: #9ca3af; /* ✅ Perbaikan kontras untuk tab tidak aktif */
          font-size: clamp(10px, 1.2vw, 13px);
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          touch-action: manipulation;
        }

        .tab .tab-icon {
          font-size: clamp(14px, 1.6vw, 18px);
        }

        .tab .tab-label {
          display: inline-block;
        }

        /* ✅ Fokus keyboard yang jelas */
        .tab:focus-visible,
        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 2px solid #e50914;
          outline-offset: 2px;
        }

        @media (max-width: 480px) {
          .tab .tab-label {
            font-size: 9px;
            letter-spacing: 0.2px;
          }
          .tab {
            padding: 8px 4px;
          }
        }

        @media (max-width: 380px) {
          .tab .tab-label {
            display: none;
          }
          .tab .tab-icon {
            font-size: 18px;
          }
          .tab {
            min-width: 44px;
            padding: 8px 4px;
          }
        }

        .tab:hover {
          color: #eaeef2;
        }

        .tab.active {
          background: #e50914;
          color: #fff;
          box-shadow: 0 4px 16px rgba(229, 9, 20, 0.3);
        }

        /* ===== TAB CONTENT ===== */
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: clamp(12px, 2vw, 22px);
        }

        .section-label {
          font-size: clamp(11px, 1.4vw, 14px);
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .hint {
          font-size: clamp(12px, 1.4vw, 15px);
          color: #6b7280;
          margin-top: -4px;
          line-height: 1.6;
        }

        .char-counter {
          font-size: 12px;
          color: #4b5563;
          text-align: right;
          margin-top: -8px;
          font-family: monospace;
        }

        /* ===== LOADING SPINNER ===== */
        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 10px;
          flex-shrink: 0;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ===== AUTO GENERATE ===== */
        .auto-generate-area {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          padding: clamp(8px, 1.5vw, 20px) 0;
        }

        .btn-generate-auto {
          width: 100%;
          max-width: 420px;
          padding: clamp(14px, 2vw, 20px) 32px;
          border: none;
          border-radius: 16px;
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          background: linear-gradient(135deg, #e50914, #b20710);
          color: #fff;
          box-shadow: 0 6px 24px rgba(229, 9, 20, 0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
          min-height: 56px;
          touch-action: manipulation;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-generate-auto:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 32px rgba(229, 9, 20, 0.45);
        }

        .btn-generate-auto:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* ===== LINKS GRID ===== */
        .links-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(10px, 1.5vw, 16px);
          margin-top: 8px;
        }

        @media (max-width: 600px) {
          .links-grid {
            grid-template-columns: 1fr;
          }
        }

        .link-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: clamp(12px, 1.5vw, 18px);
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s;
        }

        .link-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(229, 9, 20, 0.2);
        }

        .link-card-header {
          font-size: clamp(12px, 1.4vw, 15px);
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.3px;
        }

        .link-card-url {
          font-size: clamp(11px, 1.2vw, 14px);
          color: #f87171;
          word-break: break-all;
          text-decoration: none;
          line-height: 1.5;
          flex: 1;
        }

        .link-card-url:hover {
          text-decoration: underline;
        }

        .link-card-copy {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          color: #eaeef2;
          font-size: clamp(11px, 1.2vw, 14px);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          align-self: flex-start;
          min-height: 40px;
          touch-action: manipulation;
        }

        .link-card-copy:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .profile-mini {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 24px;
          font-size: clamp(12px, 1.4vw, 15px);
          color: #6b7280;
          padding: 4px 0 8px 0;
        }

        /* ===== CONVERTER ===== */
        textarea {
          width: 100%;
          padding: clamp(14px, 1.5vw, 20px);
          font-size: clamp(12px, 1.2vw, 15px);
          font-family: 'SF Mono', 'Fira Code', monospace;
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          color: #eaeef2;
          resize: vertical;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-height: clamp(120px, 15vw, 180px);
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-all;
        }

        textarea::placeholder {
          color: #4b5563;
        }

        textarea:focus {
          outline: none;
          border-color: #e50914;
          box-shadow: 0 0 0 4px rgba(229, 9, 20, 0.08);
        }

        textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .save-section {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .save-section input {
          flex: 1;
          min-width: 120px;
          padding: clamp(10px, 1.2vw, 16px);
          font-size: clamp(12px, 1.2vw, 15px);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          color: #eaeef2;
          transition: border-color 0.2s;
        }

        .save-section input::placeholder {
          color: #4b5563;
        }

        .save-section input:focus {
          outline: none;
          border-color: #e50914;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.06);
        }

        .btn-save {
          padding: clamp(10px, 1.2vw, 16px) clamp(16px, 1.5vw, 28px);
          font-size: clamp(12px, 1.2vw, 15px);
          font-weight: 600;
          border: none;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: #eaeef2;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          min-height: 44px;
          touch-action: manipulation;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-save:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
        }

        .btn-save:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .btn-forge {
          width: 100%;
          padding: clamp(14px, 1.5vw, 20px);
          font-size: clamp(15px, 1.8vw, 19px);
          font-weight: 700;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #e50914, #b20710);
          color: #fff;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 6px 24px rgba(229, 9, 20, 0.25);
          min-height: 52px;
          touch-action: manipulation;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-forge:hover:not(:disabled) {
          transform: scale(1.01);
          box-shadow: 0 8px 32px rgba(229, 9, 20, 0.35);
        }

        .btn-forge:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* ===== RESULT BOX ===== */
        .result-box {
          padding: clamp(16px, 2vw, 26px);
          background: rgba(16, 185, 129, 0.06);
          border-radius: 16px;
          border: 1px solid rgba(16, 185, 129, 0.15);
          animation: fadeUp 0.4s ease;
        }

        .converter-result {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.12);
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-header {
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px 8px;
        }

        .result-badge {
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 700;
          color: #10b981;
        }

        .result-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 14px;
        }

        .result-label {
          font-size: clamp(10px, 1.2vw, 13px);
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .result-value {
          font-size: clamp(13px, 1.4vw, 16px);
          word-break: break-all;
          color: #eaeef2;
        }

        .result-value-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .result-link {
          color: #f87171;
          text-decoration: none;
          font-weight: 500;
          word-break: break-all;
          font-size: clamp(13px, 1.4vw, 16px);
        }

        .result-link:hover {
          text-decoration: underline;
        }

        .result-token {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: clamp(11px, 1.2vw, 14px);
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 10px;
          border-radius: 8px;
          word-break: break-all;
          flex: 1;
          min-width: 0;
          color: #eaeef2;
        }

        .copy-btn {
          background: rgba(255, 255, 255, 0.04);
          border: none;
          font-size: clamp(16px, 2vw, 22px);
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 8px;
          transition: background 0.15s;
          flex-shrink: 0;
          color: #eaeef2;
          min-height: 40px;
          touch-action: manipulation;
        }

        .copy-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .result-divider {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          margin: 16px 0 14px;
        }

        /* ===== PROFILE GRID ===== */
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(8px, 1.2vw, 14px);
        }

        @media (max-width: 480px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-item {
          background: rgba(255, 255, 255, 0.03);
          padding: clamp(8px, 1.2vw, 14px);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .profile-label {
          font-size: clamp(9px, 1vw, 12px);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #6b7280;
        }

        .profile-value {
          font-size: clamp(13px, 1.4vw, 16px);
          font-weight: 500;
          color: #eaeef2;
        }

        /* ===== SAVED SECTION ===== */
        .saved-section {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .saved-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .saved-item {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(229, 9, 20, 0.08);
          padding: 4px 8px 4px 12px;
          border-radius: 16px;
          border: 1px solid rgba(229, 9, 20, 0.12);
        }

        .saved-item:hover {
          background: rgba(229, 9, 20, 0.16);
        }

        .saved-name {
          font-size: clamp(11px, 1.2vw, 14px);
          font-weight: 500;
          cursor: pointer;
          color: #eaeef2;
        }

        .saved-name:hover {
          color: #e50914;
        }

        .saved-item button {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: clamp(12px, 1.2vw, 15px);
          padding: 2px 4px;
          border-radius: 4px;
          color: #6b7280;
          transition: all 0.15s;
          min-height: 32px;
          touch-action: manipulation;
        }

        .saved-item button:hover {
          color: #eaeef2;
        }

        .btn-delete:hover {
          color: #e50914 !important;
        }

        /* ===== NETSCAPE CONVERTER ===== */
        .netscape-converter {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .netscape-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-parse {
          padding: clamp(10px, 1.2vw, 16px) clamp(16px, 1.5vw, 28px);
          background: #3b82f6;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
          touch-action: manipulation;
          flex: 1 1 auto;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-parse:hover:not(:disabled) {
          background: #2563eb;
          transform: scale(1.02);
        }

        .btn-parse:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-generate-raw {
          padding: clamp(10px, 1.2vw, 16px) clamp(16px, 1.5vw, 28px);
          background: #e50914;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
          touch-action: manipulation;
          flex: 1 1 auto;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-generate-raw:hover:not(:disabled) {
          background: #b20710;
          transform: scale(1.02);
        }

        .btn-generate-raw:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .raw-result {
          padding: 12px;
          background: rgba(16, 185, 129, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.1);
        }

        .raw-result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 4px;
        }

        .raw-label {
          font-size: clamp(12px, 1.2vw, 15px);
          color: #9ca3af;
        }

        .raw-copy-btn {
          padding: 4px 12px;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          color: #eaeef2;
          font-size: clamp(11px, 1.2vw, 14px);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          min-height: 36px;
          touch-action: manipulation;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .raw-copy-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .raw-cookie {
          display: block;
          word-break: break-all;
          font-size: clamp(11px, 1.2vw, 14px);
          color: #eaeef2;
          background: rgba(0, 0, 0, 0.2);
          padding: 8px;
          border-radius: 6px;
          margin-top: 4px;
          max-height: 150px;
          overflow: auto;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }

        /* ===== ERROR BOX (dengan ikon) ===== */
        .error-box {
          padding: clamp(12px, 1.5vw, 18px);
          background: rgba(229, 9, 20, 0.1);
          border-left: 4px solid #ef4444;
          border-radius: 12px;
          color: #f87171;
          font-size: clamp(13px, 1.4vw, 16px);
          word-break: break-word;
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .error-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .error-text {
          flex: 1;
        }

        /* ============================================ */
        /* ===== TAB INFO ===== */
        /* ============================================ */
        .info-tab {
          gap: clamp(16px, 2.5vw, 28px);
        }

        .info-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: clamp(14px, 2vw, 24px);
        }

        .info-card h3 {
          font-size: clamp(15px, 1.8vw, 20px);
          font-weight: 700;
          color: #eaeef2;
          margin-bottom: clamp(8px, 1.2vw, 14px);
        }

        .info-card p {
          font-size: clamp(13px, 1.4vw, 16px);
          color: #b0b8c5;
          line-height: 1.8;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
        }

        .info-card ul li {
          font-size: clamp(13px, 1.4vw, 16px);
          color: #b0b8c5;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          line-height: 1.7;
        }

        .info-card ul li:last-child {
          border-bottom: none;
        }

        /* ===== TUTORIAL CARD ===== */
        .tutorial-card {
          border-color: rgba(59, 130, 246, 0.2);
          background: rgba(59, 130, 246, 0.05);
        }

        .tutorial-card h3 {
          color: #60a5fa;
        }

        .tutorial-intro {
          margin-bottom: 12px;
          color: #b0b8c5;
        }

        .tutorial-intro strong {
          color: #eaeef2;
        }

        .tutorial-steps {
          list-style: none;
          padding: 0;
          counter-reset: step;
        }

        .tutorial-steps > li {
          counter-increment: step;
          padding: 10px 0 10px 40px;
          position: relative;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .tutorial-steps > li:last-child {
          border-bottom: none;
        }

        .tutorial-steps > li::before {
          content: counter(step);
          position: absolute;
          left: 0;
          top: 10px;
          width: 28px;
          height: 28px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #60a5fa;
        }

        .tutorial-steps > li strong {
          display: block;
          color: #eaeef2;
          font-size: clamp(13px, 1.4vw, 15px);
          margin-bottom: 2px;
        }

        .tutorial-steps > li p {
          font-size: clamp(12px, 1.2vw, 14px);
          color: #b0b8c5;
          margin: 0;
        }

        .tutorial-steps > li a {
          color: #60a5fa;
          text-decoration: none;
        }

        .tutorial-steps > li a:hover {
          text-decoration: underline;
        }

        .tutorial-sublist {
          list-style: none;
          padding: 4px 0 0 16px;
          margin: 0;
        }

        .tutorial-sublist li {
          font-size: clamp(12px, 1.2vw, 14px);
          color: #9ca3af;
          padding: 2px 0;
          border-bottom: none !important;
        }

        .tutorial-tip {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.08);
          border-left: 3px solid #f59e0b;
          border-radius: 8px;
          font-size: clamp(12px, 1.2vw, 14px);
          color: #fcd34d;
        }

        .warning-card {
          border-color: rgba(245, 158, 11, 0.2);
          background: rgba(245, 158, 11, 0.05);
        }

        .warning-card h3 {
          color: #f59e0b;
        }

        .warning-card ul li {
          color: #eaeef2;
        }

        .warning-card ul li strong {
          color: #f59e0b;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .feature-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .feature-item:last-child {
          border-bottom: none;
        }

        .feature-icon {
          font-size: clamp(22px, 3vw, 30px);
          flex-shrink: 0;
        }

        .feature-item strong {
          display: block;
          font-size: clamp(13px, 1.4vw, 16px);
          color: #eaeef2;
        }

        .feature-item p {
          font-size: clamp(12px, 1.2vw, 15px);
          color: #b0b8c5;
          margin: 2px 0 0 0;
        }

        .device-guide {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .device-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .device-item:last-child {
          border-bottom: none;
        }

        .device-icon {
          font-size: clamp(22px, 3vw, 30px);
          flex-shrink: 0;
        }

        .device-item strong {
          display: block;
          font-size: clamp(13px, 1.4vw, 16px);
          color: #eaeef2;
        }

        .device-item p {
          font-size: clamp(12px, 1.2vw, 15px);
          color: #b0b8c5;
          margin: 2px 0 0 0;
        }

        .device-item .note {
          font-size: clamp(11px, 1.2vw, 14px);
          color: #f59e0b;
          margin-top: 4px;
        }

        .info-footer {
          text-align: center;
          font-size: clamp(12px, 1.4vw, 15px);
          color: #6b7280;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }

        .info-footer p {
          margin: 4px 0;
        }

        /* ===== FOOTER ===== */
        footer {
          margin-top: clamp(24px, 3vw, 40px);
          padding-top: clamp(12px, 1.5vw, 20px);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          text-align: center;
        }

        footer p {
          font-size: clamp(11px, 1.2vw, 14px);
          color: #4b5563;
          letter-spacing: 1px;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .container {
            max-width: 100%;
            padding: 20px 16px;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 16px 12px;
            border-radius: 20px;
          }

          .tabs {
            gap: 2px;
            padding: 3px;
          }

          .tab {
            padding: 8px 4px;
            min-width: 50px;
          }

          .btn-generate-auto,
          .btn-forge {
            font-size: 14px;
            padding: 14px 20px;
            min-height: 48px;
          }

          .save-section {
            flex-direction: column;
          }

          .btn-save {
            width: 100%;
            justify-content: center;
          }

          .netscape-actions {
            flex-direction: column;
          }

          .btn-parse,
          .btn-generate-raw {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .link-card {
            padding: 12px;
          }

          .profile-grid {
            grid-template-columns: 1fr;
          }

          header .tagline {
            font-size: 8px;
            padding: 2px 8px;
          }

          .tutorial-steps > li {
            padding-left: 32px;
          }

          .tutorial-steps > li::before {
            width: 22px;
            height: 22px;
            font-size: 11px;
            top: 12px;
          }

          .toast {
            min-width: 160px;
            padding: 10px 14px;
            font-size: 12px;
          }
        }

        @media (min-width: 769px) {
          .container {
            padding: 36px 32px;
          }
        }

        /* ===== AKSESIBILITAS: FOKUS KEYBOARD ===== */
        *:focus-visible {
          outline: 2px solid #e50914;
          outline-offset: 2px;
        }

        /* ===== SCROLLBAR ===== */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
}
