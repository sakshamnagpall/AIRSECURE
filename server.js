const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const ATTENDANCE_PATH = path.join(DATA_DIR, 'attendance.json');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(filePath) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    return [];
  }
}

function writeJson(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function initializeDatabase() {
  ensureDataDir();
  const users = readJson(USERS_PATH);
  const attendance = readJson(ATTENDANCE_PATH);

  if (users.length === 0) {
    users.push({
      id: 1,
      name: 'Professor Kim',
      email: 'teacher@airsecure.local',
      password: bcrypt.hashSync('Teacher@123', 10),
      role: 'teacher',
      subject: 'All Subjects',
    });

    users.push({
      id: 2,
      name: 'Aarav Singh',
      email: 'student@airsecure.local',
      password: bcrypt.hashSync('Student@123', 10),
      role: 'student',
      subject: 'Mathematics',
    });

    attendance.push({
      id: 1,
      student_id: 2,
      subject: 'Mathematics',
      date: '2026-05-20',
      status: 'Present',
    });
  }

  writeJson(USERS_PATH, users);
  writeJson(ATTENDANCE_PATH, attendance);
}

function getCurrentUser(req) {
  const token = req.cookies.airsecureToken;
  if (!token) return null;
  try {
    const [email] = Buffer.from(token, 'base64').toString('utf8').split(':');
    if (!email) return null;
    const users = readJson(USERS_PATH);
    return users.find((user) => user.email === email) || null;
  } catch (error) {
    return null;
  }
}

app.get('/api/profile', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, subject: user.subject });
});

app.post('/api/signup', (req, res) => {
  const { name, email, password, role, subject } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please complete all required fields.' });
  }

  const users = readJson(USERS_PATH);
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const newUser = {
    id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
    name: name.trim(),
    email: normalizedEmail,
    password: bcrypt.hashSync(password, 10),
    role,
    subject: subject ? subject.trim() : 'General',
  };

  users.push(newUser);
  writeJson(USERS_PATH, users);
  res.json({ message: 'Registration completed.', userId: newUser.id });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJson(USERS_PATH);
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((entry) => entry.email === normalizedEmail);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');
  res.cookie('airsecureToken', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ message: 'Login successful.', role: user.role });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('airsecureToken');
  res.json({ message: 'Logged out' });
});

app.get('/api/attendance', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const users = readJson(USERS_PATH);
  const attendance = readJson(ATTENDANCE_PATH);

  if (user.role === 'teacher') {
    const records = attendance
      .map((record) => {
        const student = users.find((entry) => entry.id === record.student_id) || {};
        return {
          ...record,
          student_name: student.name || 'Unknown',
          student_email: student.email || '',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const summary = records.reduce((acc, record) => {
      const key = record.subject;
      acc[key] = acc[key] || { total: 0, present: 0 };
      acc[key].total += 1;
      if (record.status === 'Present') acc[key].present += 1;
      return acc;
    }, {});

    return res.json({ records, summary });
  }

  const studentRecords = attendance.filter((record) => record.student_id === user.id).sort((a, b) => b.date.localeCompare(a.date));
  const stats = studentRecords.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === 'Present') acc.present += 1;
      acc.bySubject[row.subject] = acc.bySubject[row.subject] || { total: 0, present: 0 };
      acc.bySubject[row.subject].total += 1;
      if (row.status === 'Present') acc.bySubject[row.subject].present += 1;
      return acc;
    },
    { total: 0, present: 0, bySubject: {} }
  );

  res.json({ records: studentRecords, stats });
});

app.post('/api/attendance', (req, res) => {
  const user = getCurrentUser(req);
  if (!user || user.role !== 'teacher') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { studentEmail, subject, date, status } = req.body;
  if (!studentEmail || !subject || !date || !status) {
    return res.status(400).json({ message: 'Missing attendance parameters.' });
  }

  const users = readJson(USERS_PATH);
  const students = users.filter((entry) => entry.role === 'student');
  const target = students.find((entry) => entry.email === studentEmail.trim().toLowerCase());
  if (!target) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const attendance = readJson(ATTENDANCE_PATH);
  const nextId = attendance.length ? Math.max(...attendance.map((entry) => entry.id)) + 1 : 1;
  const record = {
    id: nextId,
    student_id: target.id,
    subject: subject.trim(),
    date,
    status,
  };

  attendance.push(record);
  writeJson(ATTENDANCE_PATH, attendance);
  res.json({ message: 'Attendance recorded.', attendanceId: record.id });
});

app.get('/api/qrcode/:id', async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const users = readJson(USERS_PATH);
  const student = users.find((entry) => entry.id === Number(req.params.id) && entry.role === 'student');
  if (!student) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  try {
    const qrData = `airsecure://student/${student.id}`;
    const qrImage = await QRCode.toDataURL(qrData);
    res.json({ qrImage, student: { name: student.name, id: student.id } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to generate QR code.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Airsecure listening on http://localhost:${PORT}`);
});
