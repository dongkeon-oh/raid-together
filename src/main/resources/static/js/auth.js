/**
 * auth.js
 * 로그인 / 회원가입 페이지 로직
 * - AuthPage.initLogin()    : 로그인 페이지에서 호출
 * - AuthPage.initRegister() : 회원가입 페이지에서 호출
 */

const AuthPage = (() => {

  /* ────────────────────────────────
     공통 헬퍼
  ──────────────────────────────── */
  function showError(elId, msg) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function hideError(elId) {
    const el = document.getElementById(elId);
    if (el) el.classList.add('hidden');
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.textContent = loading ? '처리 중...' : btn.dataset.label;
  }

  // 로그인 성공 후 상태에 따라 라우팅
  function handleLoginSuccess(data) {
    const { status } = data.user;

    if (status === 'PENDING') {
      document.getElementById('pending-banner')?.classList.remove('hidden');
      return;
    }
    if (status === 'LOCKED') {
      document.getElementById('locked-banner')?.classList.remove('hidden');
      return;
    }

    // ACTIVE → 토큰 저장 후 메인 이동
    Token.set(data.access_token, data.refresh_token);
    location.href = '/index.html';
  }

  /* ────────────────────────────────
     Google OAuth
  ──────────────────────────────── */
  function initGoogleOAuth(btnId, mode) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    // Google Identity Services 라이브러리 로드
    // 실제 구현 시 index.html 등에 아래 스크립트 추가 필요
    // <script src="https://accounts.google.com/gsi/client"></script>
    btn.addEventListener('click', () => {
      if (typeof google === 'undefined') {
        showToast('Google 로그인을 사용할 수 없습니다.', 'danger');
        return;
      }

      google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: async (resp) => {
          try {
            if (mode === 'login') {
              const data = await api.auth.googleLogin(resp.credential);
              handleLoginSuccess(data);
            } else {
              // 회원가입: id_token 저장 후 폼 이메일 자동 입력
              const payload = JSON.parse(atob(resp.credential.split('.')[1]));
              document.getElementById('reg-email').value = payload.email || '';
              document.getElementById('reg-email').readOnly = true;
              // google_id_token을 숨김 필드에 보관
              let hiddenEl = document.getElementById('google-id-token');
              if (!hiddenEl) {
                hiddenEl = document.createElement('input');
                hiddenEl.type = 'hidden';
                hiddenEl.id = 'google-id-token';
                document.getElementById('form-register').appendChild(hiddenEl);
              }
              hiddenEl.value = resp.credential;
              showToast('Google 계정이 연동되었습니다. 나머지 정보를 입력해 주세요.', 'success');
            }
          } catch (err) {
            handleError(err);
          }
        }
      });

      google.accounts.id.prompt();
    });
  }

  /* ────────────────────────────────
     로그인 페이지
  ──────────────────────────────── */
  function initLogin() {
    // 이미 로그인된 경우 메인으로
    if (Token.hasAccess()) { location.href = '/index.html'; return; }

    initGoogleOAuth('btn-google-login', 'login');

    const form = document.getElementById('form-login');
    const btn  = document.getElementById('btn-login');
    btn.dataset.label = btn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError('login-error');

      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      // 간단 유효성 검사
      if (!email || !password) {
        showError('login-error', '이메일과 비밀번호를 입력해 주세요.');
        return;
      }

      setLoading(btn, true);
      try {
        // 자체 로그인 (이메일/비밀번호)
        const data = await api.post('/auth/login', { email, password });
        handleLoginSuccess(data);
      } catch (err) {
        if (err.code === 'AUTH_PENDING') {
          document.getElementById('pending-banner')?.classList.remove('hidden');
        } else if (err.code === 'AUTH_LOCKED') {
          document.getElementById('locked-banner')?.classList.remove('hidden');
        } else {
          showError('login-error', err.message || '로그인에 실패했습니다.');
        }
      } finally {
        setLoading(btn, false);
      }
    });
  }

  /* ────────────────────────────────
     회원가입 페이지
  ──────────────────────────────── */
  function initRegister() {
    initGoogleOAuth('btn-google-register', 'register');

    const form = document.getElementById('form-register');
    const btn  = document.getElementById('btn-register');
    btn.dataset.label = btn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError('reg-error');

      const email    = document.getElementById('reg-email').value.trim();
      const name     = document.getElementById('reg-name').value.trim();
      const apiKey   = document.getElementById('reg-api-key').value.trim();
      const pw       = document.getElementById('reg-password').value;
      const pwConfirm = document.getElementById('reg-password-confirm').value;
      const googleToken = document.getElementById('google-id-token')?.value || null;

      // 유효성 검사
      if (!email)  { showError('reg-error', '이메일을 입력해 주세요.'); return; }
      if (!name)   { showError('reg-error', '사용자 이름을 입력해 주세요.'); return; }
      if (!apiKey) { showError('reg-error', '로스트아크 API Key를 입력해 주세요.'); return; }
      if (!pw)     { showError('reg-error', '비밀번호를 입력해 주세요.'); return; }
      if (pw !== pwConfirm) { showError('reg-error', '비밀번호가 일치하지 않습니다.'); return; }
      if (pw.length < 8)   { showError('reg-error', '비밀번호는 8자 이상이어야 합니다.'); return; }

      setLoading(btn, true);
      try {
        await api.auth.register({
          email,
          name,
          lostark_api_key: apiKey,
          password: pw,
          ...(googleToken ? { google_id_token: googleToken } : {})
        });

        // 가입 성공 → 폼 숨기고 완료 메시지 표시
        form.classList.add('hidden');
        document.getElementById('register-success')?.classList.remove('hidden');
        document.querySelector('.auth-switch')?.classList.add('hidden');
      } catch (err) {
        if (err.code === 'USER_ALREADY_EXISTS') {
          showError('reg-error', '이미 가입된 이메일입니다.');
        } else {
          showError('reg-error', err.message || '가입에 실패했습니다.');
        }
      } finally {
        setLoading(btn, false);
      }
    });
  }

  return { initLogin, initRegister };
})();
