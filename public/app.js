async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function showAlert(message) {
  const existing = document.querySelector('.alert-card');
  if (existing) existing.remove();
  const alert = document.createElement('div');
  alert.className = 'alert-card';
  alert.textContent = message;
  alert.style.marginTop = '16px';
  alert.style.padding = '16px';
  alert.style.borderRadius = '16px';
  alert.style.background = 'rgba(56, 189, 248, 0.12)';
  alert.style.color = '#dbeafe';
  const container = document.querySelector('.auth-panel') || document.body;
  container.appendChild(alert);
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;

  try {
    const result = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.role === 'teacher') {
      window.location.href = 'teacher.html';
    } else {
      window.location.href = 'student.html';
    }
  } catch (error) {
    showAlert(error.message);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const name = document.querySelector('#name').value;
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;
  const role = document.querySelector('#role').value;
  const subject = document.querySelector('#subject').value;

  try {
    await apiRequest('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, subject }),
    });
    showAlert('Account created. Please login.');
  } catch (error) {
    showAlert(error.message);
  }
}

const loginForm = document.querySelector('#loginForm');
if (loginForm) loginForm.addEventListener('submit', handleLogin);
const signupForm = document.querySelector('#signupForm');
if (signupForm) signupForm.addEventListener('submit', handleSignup);
