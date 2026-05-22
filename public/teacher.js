async function fetchProfile() {
  const profile = await apiRequest('/api/profile');
  if (profile.role !== 'teacher') {
    window.location.href = 'index.html';
  }
  return profile;
}

function renderSummary(summary) {
  const container = document.querySelector('#summaryContainer');
  container.innerHTML = '';
  if (!summary || Object.keys(summary).length === 0) {
    container.innerHTML = '<p>No attendance records yet.</p>';
    return;
  }
  const list = document.createElement('div');
  list.className = 'summary-grid';
  Object.entries(summary).forEach(([subject, data]) => {
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `<strong>${subject}</strong><p>${data.present}/${data.total} present</p>`;
    list.appendChild(card);
  });
  container.appendChild(list);
}

function renderAttendance(records) {
  const tbody = document.querySelector('#attendanceTable tbody');
  tbody.innerHTML = '';
  records.forEach((record) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.student_name}</td>
      <td>${record.student_email}</td>
      <td>${record.subject}</td>
      <td>${record.date}</td>
      <td>${record.status}</td>
    `;
    tbody.appendChild(row);
  });
}

async function loadAttendance() {
  try {
    const data = await apiRequest('/api/attendance');
    renderSummary(data.summary);
    renderAttendance(data.records);
  } catch (error) {
    console.error(error);
  }
}

async function handleAttendanceSubmit(event) {
  event.preventDefault();
  const studentEmail = document.querySelector('#studentEmail').value;
  const subject = document.querySelector('#subject').value;
  const date = document.querySelector('#date').value;
  const status = document.querySelector('#status').value;

  try {
    await apiRequest('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ studentEmail, subject, date, status }),
    });
    showAlert('Attendance saved successfully.');
    loadAttendance();
  } catch (error) {
    showAlert(error.message);
  }
}

async function handleQrSubmit(event) {
  event.preventDefault();
  const id = document.querySelector('#studentId').value;
  const output = document.querySelector('#qrResult');
  output.innerHTML = '<p>Generating QR code...</p>';

  try {
    const data = await apiRequest(`/api/qrcode/${encodeURIComponent(id)}`);
    output.innerHTML = `<img src="${data.qrImage}" alt="QR Code"><p>${data.student.name}</p>`;
  } catch (error) {
    output.innerHTML = `<p>${error.message}</p>`;
  }
}

async function handleLogout() {
  await apiRequest('/api/logout', { method: 'POST' });
  window.location.href = 'index.html';
}

const attendanceForm = document.querySelector('#attendanceForm');
if (attendanceForm) attendanceForm.addEventListener('submit', handleAttendanceSubmit);
const qrForm = document.querySelector('#qrForm');
if (qrForm) qrForm.addEventListener('submit', handleQrSubmit);
const logoutLink = document.querySelector('#logoutLink');
if (logoutLink) logoutLink.addEventListener('click', (event) => {
  event.preventDefault();
  handleLogout();
});

window.addEventListener('DOMContentLoaded', async () => {
  if (document.body.contains(document.querySelector('#attendanceTable'))) {
    await fetchProfile();
    loadAttendance();
  }
});
