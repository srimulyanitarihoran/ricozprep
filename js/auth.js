// Real login/sign-up, backed by Netlify Database via /api/signup and /api/login.
const $ = (id) => document.getElementById(id);

function getSession() {
  try { return JSON.parse(localStorage.getItem('ricozprep_session') || 'null'); }
  catch { return null; }
}
function setSession(email) {
  try { localStorage.setItem('ricozprep_session', JSON.stringify({ email })); } catch {}
}
function clearSession() {
  try { localStorage.removeItem('ricozprep_session'); } catch {}
}

function updateLoginButton() {
  const btn = $('btn-login');
  const session = getSession();
  btn.textContent = session ? session.email : 'Log in';
}

export function initAuthModal() {
  const overlay = $('auth-modal');
  const form = $('auth-form');
  const errorBox = $('auth-error');
  let mode = 'login'; // or 'signup'

  const open = () => {
    const session = getSession();
    if (session) {
      if (confirm(`Signed in as ${session.email}. Log out?`)) { clearSession(); updateLoginButton(); }
      return;
    }
    errorBox.textContent = '';
    form.reset();
    overlay.hidden = false;
  };
  const close = () => { overlay.hidden = true; };

  $('btn-login').addEventListener('click', open);
  $('auth-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const tabLogin = $('tab-login');
  const tabSignup = $('tab-signup');
  const setTab = (next) => {
    mode = next;
    tabLogin.classList.toggle('active', next === 'login');
    tabSignup.classList.toggle('active', next === 'signup');
    errorBox.textContent = '';
  };
  tabLogin.addEventListener('click', () => setTab('login'));
  tabSignup.addEventListener('click', () => setTab('signup'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    const email = form.email.value.trim();
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait…';

    try {
      const res = await fetch(mode === 'login' ? '/api/login' : '/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setSession(data.email);
      updateLoginButton();
      close();
    } catch (err) {
      errorBox.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue';
    }
  });

  updateLoginButton();
}
