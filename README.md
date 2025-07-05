# Quick File Transfer 🚀

A modern, fast, and secure web application for transferring files between devices using QR codes and room-based sharing.

## ✨ Features

- **🎯 Simple Interface**: Choose to send or receive files with an intuitive design
- **📱 QR Code Sharing**: Generate QR codes for instant file sharing
- **🏃 Real-time Transfer**: Live progress tracking with speed monitoring
- **📊 Statistics Dashboard**: Track transfer history and performance
- **🔒 Secure Rooms**: 6-digit room codes with automatic expiration
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **⚡ Fast Upload**: Drag & drop support with multi-file selection
- **🌐 Cross-platform**: Works on any device with a web browser

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript ES6
- **Backend**: Node.js + Express + Socket.io
- **File Transfer**: Multipart upload with progress tracking
- **QR Codes**: Custom QR code generation
- **Real-time**: WebSocket communication for live updates
- **Storage**: localStorage for persistent statistics

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/diepvantien/quick-file-transfer.git
cd quick-file-transfer
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and go to:
```
http://localhost:3000
```

## 🚀 Usage

### Sending Files
1. Click "Send Files" on the homepage
2. Drag & drop files or click to select
3. Click "Upload Files" to create a room
4. Share the QR code or room code with recipients
5. Monitor transfer progress in real-time

### Receiving Files
1. Click "Receive Files" on the homepage
2. Scan the QR code or enter the 6-digit room code
3. View available files and click download
4. Monitor download progress

## 📁 Project Structure

```
quick-file-transfer/
├── package.json          # Project dependencies
├── server.js             # Express server with Socket.io
├── public/               # Static files
│   ├── index.html       # Main landing page
│   ├── sender.html      # File upload page
│   ├── receiver.html    # File download page
│   ├── css/
│   │   └── style.css    # Modern CSS with gradients
│   └── js/
│       ├── main.js      # Common utilities
│       ├── sender.js    # Upload functionality
│       ├── receiver.js  # Download functionality
│       ├── stats.js     # Statistics tracking
│       └── qrcode.min.js # QR code generation
├── uploads/             # Temporary file storage
└── README.md           # This file
```

## 🎨 Features in Detail

### Real-time Progress Tracking
- Live upload/download progress bars
- Speed monitoring (MB/s, KB/s)
- Transfer statistics
- Connection status indicators

### Security Features
- Random 6-digit room codes
- Automatic room expiration (30 minutes)
- File size limits (100MB per file, 500MB total)
- Secure file cleanup

### Statistics Dashboard
- Total data sent/received
- Number of files transferred
- Best transfer speed recorded
- Persistent storage across sessions

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Optimized for all screen sizes
- Modern gradient design

## 🔧 Configuration

You can customize the server by setting environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Material Icons for beautiful icons
- Inter font for clean typography
- Modern CSS techniques for responsive design

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for fast and secure file sharing!