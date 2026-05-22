async function fetchProfileAndData() {
  const profile = await apiRequest('/api/profile');
  if (profile.role !== 'student') {
    window.location.href = 'index.html';
  }
  document.querySelector('#studentName').textContent = profile.name;
  return profile;
}

function renderAttendanceTable(records) {
  const tbody = document.querySelector('#attendanceTable tbody');
  tbody.innerHTML = '';
  records.forEach((record) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.subject}</td>
      <td>${record.date}</td>
      <td>${record.status}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderOverview(stats) {
  const present = stats.present || 0;
  const total = stats.total || 0;
  const ratio = total ? Math.round((present / total) * 100) : 0;
  const summaryText = document.querySelector('#summaryText');
  summaryText.textContent = `You have attended ${present} of ${total} recorded sessions (${ratio}% attendance).`;
}

function buildChart(stats) {
  const canvas = document.getElementById('attendanceChart');
  if (!canvas) return;
  const labels = Object.keys(stats.bySubject || {});
  const values = labels.map((subject) => {
    const item = stats.bySubject[subject];
    return item.total ? Math.round((item.present / item.total) * 100) : 0;
  });

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Attendance % by subject',
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        borderRadius: 12,
        data: values,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#cbd5e1',
          },
          grid: {
            color: 'rgba(148, 163, 184, .12)',
          },
        },
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { display: false },
        },
      },
    },
  });
}

async function loadStudentData() {
  try {
    const data = await apiRequest('/api/attendance');
    renderOverview(data.stats);
    renderAttendanceTable(data.records);
    buildChart(data.stats);
  } catch (error) {
    showAlert(error.message);
  }
}

async function handleLogout() {
  await apiRequest('/api/logout', { method: 'POST' });
  window.location.href = 'index.html';
}

const logoutLink = document.querySelector('#logoutLink');
if (logoutLink) logoutLink.addEventListener('click', (event) => {
  event.preventDefault();
  handleLogout();
});

window.addEventListener('DOMContentLoaded', async () => {
  if (document.body.contains(document.querySelector('#attendanceChart'))) {
    await fetchProfileAndData();
    loadStudentData();
  }
});
