# Quick File Transfer

A simple and intuitive web application for quick file transfer between devices on the same WiFi network, similar to AirDrop.

## Features

- **Send Files**: Upload files with drag & drop or click to select
- **QR Code Sharing**: Automatically generates QR codes for easy sharing
- **Receive Files**: Scan QR code or enter room code to download files
- **Real-time Status**: Live updates on connection and transfer progress
- **Secure**: 6-digit room codes with session timeout
- **Mobile Friendly**: Responsive design for all devices

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## How to Use

### Sending Files
1. Click "Send File" on the homepage
2. Select or drag & drop your file
3. Click "Upload File" 
4. Share the generated QR code or room code with others

### Receiving Files
1. Click "Receive File" on the homepage
2. Scan the QR code or enter the 6-digit room code
3. Click "Download File" to save it to your device

## Technical Details

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.io
- **File Upload**: Multer middleware
- **QR Code Generation**: qrcode library
- **File Size Limit**: 100MB per file
- **Session Timeout**: 1 hour

## Project Structure

```
/
├── public/
│   ├── index.html          # Main page
│   ├── sender.html         # File sender page
│   ├── receiver.html       # File receiver page
│   ├── css/
│   │   └── style.css       # Styling
│   └── js/
│       ├── main.js         # Main page logic
│       ├── sender.js       # Sender page logic
│       └── receiver.js     # Receiver page logic
├── uploads/                # Temporary file storage
├── server.js              # Express server
├── package.json           # Dependencies
└── README.md              # This file
```

## Security Features

- Random 6-digit room codes
- Automatic file cleanup after 1 hour
- File size limits (100MB)
- Session-based transfers
- No permanent file storage

## Development

For development with auto-reload:
```bash
npm run dev
```

## License

MIT License