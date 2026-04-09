const BASE_URL = '/v1';

/* ────────────────────────────────
   TOKEN STORAGE
──────────────────────────────── */
const Token = {
  get access()  { return sessionStorage.getItem('access_token'); },
  get refresh() { return sessionStorage.getItem('refresh_token'); },
  set(access, refresh) {
    sessionStorage.setItem('access_token', access);
    if (refresh) sessionStorage.setItem('refresh_token', refresh);
  },
  clear() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  },
  hasAccess() { return !!this.access; }
};

/* ────────────────────────────────
   FETCH WRAPPER
──────────────────────────────── */
async function request(method, path, body = null, retry = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (Token.hasAccess()) headers['Authorization'] = `Bearer ${Token.access}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let res = await fetch(BASE_URL + path, opts);

  // 401 → 토큰 갱신 후 재시도
  if (res.status === 401 && retry) {
    const ok = await refreshToken();
    if (ok) return request(method, path, body, false);
    Token.clear();
    location.href = '/login.html';
    return;
  }

  const data = await res.json();

  if (!data.success) {
    const err = new Error(data.error?.message || '요청에 실패했습니다.');
    err.code = data.error?.code;
    err.status = res.status;
    throw err;
  }

  return data.data;
}

async function refreshToken() {
  if (!Token.refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: Token.refresh })
    });
    const data = await res.json();
    if (data.success) { Token.set(data.data.access_token); return true; }
    return false;
  } catch { return false; }
}

/* ────────────────────────────────
   API METHODS
──────────────────────────────── */
const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),

  /* AUTH */
  auth: {
    googleLogin: (id_token)           => api.post('/auth/google', { id_token }),
    register:    (body)               => api.post('/auth/register', body),
    logout:      ()                   => api.post('/auth/logout'),
  },

  /* USER */
  user: {
    me:             ()                => api.get('/users/me'),
    characters:     (diffId)          => api.get(`/users/me/characters${diffId ? `?raid_difficulty_id=${diffId}` : ''}`),
    syncCharacters: ()                => api.post('/users/me/characters/sync'),
    search:         (name, diffId)    => api.get(`/users/search?name=${encodeURIComponent(name)}${diffId ? `&raid_difficulty_id=${diffId}` : ''}`),
  },

  /* RAID TYPES */
  raid: {
    list:   ()          => api.get('/raid-types'),
    create: (body)      => api.post('/raid-types', body),
    update: (id, body)  => api.put(`/raid-types/${id}`, body),
    delete: (id)        => api.delete(`/raid-types/${id}`),
  },

  /* APPOINTMENTS */
  appointment: {
    list:       (params) => api.get('/appointments' + buildQuery(params)),
    detail:     (id)     => api.get(`/appointments/${id}`),
    create:     (body)   => api.post('/appointments', body),
    transferLeader: (id, userId) => api.patch(`/appointments/${id}/leader`, { new_leader_user_id: userId }),
    leave:      (id)     => api.delete(`/appointments/${id}/members/me`),
    mine:       (type)   => api.get(`/appointments/me${type ? `?type=${type}` : ''}`),
  },

  /* NOTIFICATIONS */
  notification: {
    list:       ()   => api.get('/notifications'),
    unreadCount:()   => api.get('/notifications/unread-count'),
    accept:     (id) => api.post(`/notifications/${id}/accept`),
    reject:     (id) => api.post(`/notifications/${id}/reject`),
    readAll:    ()   => api.patch('/notifications/read-all'),
  },

  /* ADMIN */
  admin: {
    users:        (params)    => api.get('/admin/users' + buildQuery(params)),
    approve:      (id)        => api.patch(`/admin/users/${id}/approve`),
    reject:       (id)        => api.patch(`/admin/users/${id}/reject`),
    lock:         (id)        => api.patch(`/admin/users/${id}/lock`),
    weeklyStats:  (params)    => api.get('/admin/stats/weekly' + buildQuery(params)),
    userRaids:    (id, params) => api.get(`/admin/stats/users/${id}/appointments` + buildQuery(params)),
  },
};

/* ────────────────────────────────
   HELPERS
──────────────────────────────── */
function buildQuery(params = {}) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? '?' + q : '';
}

/* ────────────────────────────────
   ERROR HANDLER HELPER
──────────────────────────────── */
function handleError(err, fallback = '오류가 발생했습니다.') {
  console.error(err);
  showToast(err.message || fallback, 'danger');
}

/* ────────────────────────────────
   GLOBAL TOAST
──────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'success') {
  let el = document.getElementById('global-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-toast';
    el.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      z-index:${getComputedStyle(document.documentElement).getPropertyValue('--z-toast') || 300};
      min-width:200px; max-width:360px; text-align:center;
      padding:10px 16px; border-radius:8px; font-size:12px;
      transition:opacity 0.2s ease; pointer-events:none;
    `;
    document.body.appendChild(el);
  }
  const styles = {
    success: 'background:#1a2e1a;color:#5db85d;border:0.5px solid #2a4a2a;',
    danger:  'background:#2e1a1a;color:#d07070;border:0.5px solid #5a2a2a;',
    warning: 'background:#2a2210;color:#c8a040;border:0.5px solid #4a3a18;',
  };
  el.style.cssText += styles[type] || styles.success;
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
