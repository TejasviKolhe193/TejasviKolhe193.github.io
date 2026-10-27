/**
 * Tejasvi Kolhe Portfolio - Private Visitor IP Logger & Admin Dashboard
 * Password: tejasvi@2026
 * SHA-256: aab817e39a9e6eda6e9e722b863deeab283cf6618e1a707e62cfb3824b7a9cfd
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'tejasvi_visitor_ip_logs';
  var AUTH_KEY = 'tejasvi_admin_auth_token';
  var PASS_HASH = 'aab817e39a9e6eda6e9e722b863deeab283cf6618e1a707e62cfb3824b7a9cfd'; // SHA-256 for tejasvi@2026
  var CLOUD_TOPIC = 'tejasvi_kolhe_visits_log';

  function formatIST(date) {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date) + ' IST';
    } catch (e) {
      return date.toLocaleString() + ' (IST)';
    }
  }

  function getDeviceDetails() {
    var ua = navigator.userAgent;
    var browser = 'Unknown Browser';
    var os = 'Unknown OS';
    var device = 'Desktop';

    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Internet';
    else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
    else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';

    if (/Windows NT 10.0/i.test(ua)) os = 'Windows 11/10';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    if (/Mobi|Android|iPhone|iPod/i.test(ua)) device = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

    return { browser: browser, os: os, device: device };
  }

  async function computeSHA256(str) {
    var buffer = new TextEncoder().encode(str);
    var hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function getLogs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {}
  }

  async function logCurrentVisit() {
    var lastLogged = sessionStorage.getItem('tejasvi_last_logged_visit');
    var now = new Date();
    if (lastLogged && (now.getTime() - parseInt(lastLogged, 10)) < 15000) {
      return;
    }
    sessionStorage.setItem('tejasvi_last_logged_visit', now.getTime().toString());

    var dev = getDeviceDetails();
    var ref = document.referrer ? new URL(document.referrer).hostname : 'Direct / Bookmarked';
    var entryPath = window.location.pathname + window.location.hash;

    var visit = {
      id: 'v_' + Math.random().toString(36).substring(2, 9),
      ip: 'Detecting...',
      city: 'Detecting...',
      region: '',
      country: 'India',
      countryCode: 'IN',
      flag: '📍',
      timeIST: formatIST(now),
      timestamp: now.getTime(),
      device: dev.device,
      browser: dev.browser,
      os: dev.os,
      page: entryPath || '/',
      referrer: ref
    };

    var logs = getLogs();
    logs.unshift(visit);
    saveLogs(logs);

    try {
      var res = await fetch('https://ipwho.is/');
      var data = await res.json();
      if (data && data.ip) {
        visit.ip = data.ip;
        visit.city = data.city || 'Unknown';
        visit.region = data.region || '';
        visit.country = data.country || 'Unknown';
        visit.countryCode = data.country_code || '';
        visit.flag = data.flag ? data.flag.emoji : '📍';
      }
    } catch (err) {
      try {
        var res2 = await fetch('https://api.ipify.org?format=json');
        var data2 = await res2.json();
        if (data2 && data2.ip) {
          visit.ip = data2.ip;
        }
      } catch (err2) {
        visit.ip = '127.0.0.1 (Local Client)';
      }
    }

    var currentLogs = getLogs();
    for (var i = 0; i < currentLogs.length; i++) {
      if (currentLogs[i].id === visit.id) {
        currentLogs[i] = visit;
        break;
      }
    }
    saveLogs(currentLogs);

    // Silent notification via ntfy
    try {
      fetch('https://ntfy.sh/' + CLOUD_TOPIC, {
        method: 'POST',
        headers: {
          'Title': 'New Visitor on Portfolio: ' + visit.ip,
          'Tags': 'eyes,globe_with_meridians'
        },
        body: 'IP: ' + visit.ip + '\nLocation: ' + visit.city + ', ' + visit.country + '\nTime (IST): ' + visit.timeIST + '\nDevice: ' + visit.device + ' (' + visit.browser + ' on ' + visit.os + ')\nPage: ' + visit.page
      }).catch(function () {});
    } catch (e) {}

    renderLogsTable();
  }

  function isAuthorized() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  // Globally accessible functions
  window.openAdminVisitorModal = function () {
    var modal = document.getElementById('adminVisitorModal');
    if (!modal) {
      console.warn('adminVisitorModal element not found');
      return;
    }
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('z-index', '99999999', 'important');

    if (isAuthorized()) {
      showDashboardView();
    } else {
      showLoginView();
    }
  };

  window.closeAdminVisitorModal = function () {
    var modal = document.getElementById('adminVisitorModal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }
    if (window.location.hash === '#admin') {
      history.replaceState(null, null, window.location.pathname);
    }
  };

  function showLoginView() {
    var loginView = document.getElementById('adminLoginView');
    var dashView = document.getElementById('adminDashboardView');
    var passInp = document.getElementById('adminPassInput');
    var errEl = document.getElementById('adminLoginError');

    if (loginView) loginView.style.display = 'block';
    if (dashView) dashView.style.display = 'none';
    if (passInp) {
      passInp.value = '';
      setTimeout(function () { passInp.focus(); }, 120);
    }
    if (errEl) errEl.style.display = 'none';
  }

  function showDashboardView() {
    var loginView = document.getElementById('adminLoginView');
    var dashView = document.getElementById('adminDashboardView');
    if (loginView) loginView.style.display = 'none';
    if (dashView) dashView.style.display = 'block';
    renderLogsTable();
  }

  window.handleAdminPasswordSubmit = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var passInp = document.getElementById('adminPassInput');
    var errorEl = document.getElementById('adminLoginError');
    var pass = passInp ? passInp.value.trim() : '';

    if (!pass) return;

    var hash = await computeSHA256(pass);

    if (hash === PASS_HASH) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      if (errorEl) errorEl.style.display = 'none';
      showDashboardView();
    } else {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Incorrect password. Access denied.';
      }
      var card = document.getElementById('adminLoginCard');
      if (card) {
        card.classList.add('shake');
        setTimeout(function () { card.classList.remove('shake'); }, 500);
      }
    }
  };

  window.handleAdminLogout = function () {
    sessionStorage.removeItem(AUTH_KEY);
    showLoginView();
  };

  window.handleAdminExportCSV = function () {
    var logs = getLogs();
    if (logs.length === 0) {
      alert('No visitor records logged yet.');
      return;
    }
    var headers = ['ID', 'IP Address', 'City', 'Region', 'Country', 'Visit Time (IST)', 'Device', 'Browser', 'OS', 'Page', 'Referrer'];
    var rows = logs.map(function (l) {
      return [
        l.id,
        '"' + (l.ip || '') + '"',
        '"' + (l.city || '') + '"',
        '"' + (l.region || '') + '"',
        '"' + (l.country || '') + '"',
        '"' + (l.timeIST || '') + '"',
        '"' + (l.device || '') + '"',
        '"' + (l.browser || '') + '"',
        '"' + (l.os || '') + '"',
        '"' + (l.page || '') + '"',
        '"' + (l.referrer || '') + '"'
      ];
    });
    var csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(function(r) { return r.join(','); })].join('\n');
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'tejasvi_visitor_ip_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.handleAdminClearLogs = function () {
    if (confirm('Clear all visitor IP records? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      renderLogsTable();
    }
  };

  window.handleAdminRefresh = function () {
    renderLogsTable();
  };

  window.toggleAdminPasswordVisibility = function () {
    var inp = document.getElementById('adminPassInput');
    var btn = document.getElementById('togglePassBtn');
    if (!inp) return;
    if (inp.type === 'password') {
      inp.type = 'text';
      if (btn) btn.innerHTML = '<i class="ph ph-eye-slash"></i>';
    } else {
      inp.type = 'password';
      if (btn) btn.innerHTML = '<i class="ph ph-eye"></i>';
    }
  };

  window.copyVisitorIP = function (btn, ip) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ip).then(function() {
        var orig = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-check text-success"></i> Copied!';
        setTimeout(function() { btn.innerHTML = orig; }, 1800);
      });
    }
  };

  function renderLogsTable(searchQuery) {
    var tbody = document.getElementById('adminLogsTbody');
    if (!tbody) return;

    var logs = getLogs();
    var q = (searchQuery || '').toLowerCase();

    var statTotal = document.getElementById('adminStatTotal');
    var statUnique = document.getElementById('adminStatUnique');
    var statLatest = document.getElementById('adminStatLatest');

    if (statTotal) statTotal.textContent = logs.length;
    if (statUnique) statUnique.textContent = new Set(logs.map(function (l) { return l.ip; })).size;
    if (statLatest) statLatest.textContent = logs.length > 0 ? logs[0].timeIST : 'No visits yet';

    tbody.innerHTML = '';

    var filtered = logs.filter(function (l) {
      if (!q) return true;
      var str = (l.ip + ' ' + l.city + ' ' + l.country + ' ' + l.device + ' ' + l.browser + ' ' + l.os + ' ' + l.timeIST).toLowerCase();
      return str.indexOf(q) > -1;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No visitor records found.</td></tr>';
      return;
    }

    filtered.forEach(function (visit, idx) {
      var tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-secondary small font-monospace">${idx + 1}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark border border-secondary text-info font-monospace fs-6 px-2 py-1">${visit.ip}</span>
            <button type="button" class="btn btn-sm btn-link text-secondary p-0" title="Copy IP" onclick="window.copyVisitorIP(this, '${visit.ip}')">
              <i class="ph ph-copy"></i>
            </button>
          </div>
        </td>
        <td>
          <span class="text-white">${visit.flag || '📍'} ${visit.city || 'Unknown'}${visit.region ? ', ' + visit.region : ''}, ${visit.country || 'Unknown'}</span>
        </td>
        <td>
          <span class="text-white font-monospace small">${visit.timeIST}</span>
        </td>
        <td>
          <span class="text-light small">${visit.device}</span> &bull; 
          <span class="text-secondary small">${visit.browser} on ${visit.os}</span>
        </td>
        <td>
          <span class="badge bg-secondary bg-opacity-25 text-light font-monospace small">${visit.page || '/'}</span>
        </td>
        <td>
          <span class="badge bg-dark border border-secondary text-secondary small">${visit.referrer || 'Direct'}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function init() {
    logCurrentVisit();

    // Check URL hash for #admin
    if (window.location.hash === '#admin') {
      window.openAdminVisitorModal();
    }

    // Keyboard shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.openAdminVisitorModal();
      }
      if (e.key === 'Escape') {
        window.closeAdminVisitorModal();
      }
    });

    // Delegated click listener across whole document
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('#adminVisitorTriggerBtn, .admin-lock-btn, [data-admin-trigger]');
      if (btn) {
        e.preventDefault();
        window.openAdminVisitorModal();
        return;
      }
      var closeBtn = e.target.closest('#adminModalClose');
      if (closeBtn) {
        e.preventDefault();
        window.closeAdminVisitorModal();
        return;
      }
      // Click outside dialog to dismiss
      var modal = document.getElementById('adminVisitorModal');
      if (modal && e.target === modal) {
        window.closeAdminVisitorModal();
      }
    });

    // Search input listener
    var searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        renderLogsTable(e.target.value);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
