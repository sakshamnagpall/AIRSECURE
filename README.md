# Airsecure

Airsecure is a modern education and surveillance assistant designed to combine real-time object monitoring with classroom attendance management. The project includes a web interface for teachers and students, authentication, attendance analytics, and webcam-integrated object detection.

## Key Features

- Authentication with sign-up and login flows.
- Teacher dashboard for attendance tracking, student registration, and subject reporting.
- Student dashboard with attendance summaries and QR code access.
- Webcam-based object monitoring with restricted item alerts and voice notifications.
- Lightweight Express backend with JSON-backed storage for easy deployment.

## Project Structure

- `server.js` - Express backend and API routes.
- `public/` - Static web interface pages and client-side scripts.
- `data/` - SQLite database storage.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm start
```

3. Open `http://localhost:3000` in your browser.

## Notes

- The current demo uses a simulated detection flow to keep the app lightweight and directly runnable.
- To integrate a real YOLOv10n model, replace the detection stub in `public/detector.js` with your model inference pipeline.

## Upload to GitHub

This repository is ready for GitHub. Commit the files and push to your remote repository after you create it.
