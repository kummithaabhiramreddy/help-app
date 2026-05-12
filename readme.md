# 🩸 Donor Registry — Local JSON Server

## Setup (one-time)

1. Make sure **Node.js** is installed → https://nodejs.org
2. Open a terminal in this folder and run:

```bash
npm install
```

## Start the server

```bash
node server.js
# or
npm start
```

You'll see:
```
🩸 Donor Registry Server started
   URL  :  http://localhost:3000
   Data :  /path/to/donors.json
   Files:  /path/to/uploads/
```

## Place your HTML file

Put `donor_registry.html` in the **same folder** as `server.js`,
then open it in your browser at `file:///...` or serve it via the
same Node server (no extra config needed — CORS is enabled).

## Where is the data?

| What | Where |
|------|-------|
| All registrations | `donors.json` (auto-created) |
| Uploaded photos | `uploads/` folder |
| Uploaded PDFs | `uploads/` folder |
| Biometric files | `uploads/` folder |

## donors.json format

```json
[
  {
    "donorId":       "BHM-1A2B3C",
    "name":          "Ravi Kumar",
    "dob":           "01 January 2000",
    "bloodGroup":    "B+",
    "donationType":  "Blood",
    "organs":        [],
    "city":          "Bhimavaram",
    "phone":         "9876543210",
    "email":         "ravi@example.com",
    "biometricToken": "fp:1k2m3n",
    "timestamp":     1709301234567,
    "registeredAt":  "2026-03-01T10:30:00.000Z",
    "files": {
      "photo":     "1709301234567-photo.jpg",
      "healthPdf": null,
      "biometric": null
    }
  }
]
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/donors` | Register a new donor |
| `GET`  | `/api/donors` | List all donors (JSON) |

## Notes

- Blood-Only donors are blocked from re-registering within **90 days** (enforced both client-side and server-side).
- Organ-Only and Blood+Organ donors can always register freely.
- Uploaded files are stored in the `uploads/` folder with timestamped filenames.