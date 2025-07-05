# 📁 Quick File Transfer

A fast and secure file sharing web application with advanced performance tracking and statistics.

## Features

### Core Functionality
- **File Upload**: Drag and drop or click to upload files
- **Share Links**: Generate shareable links for file transfers
- **QR Code Support**: Quick sharing via QR codes
- **Responsive Design**: Works seamlessly on desktop and mobile

### Performance Tracking & Statistics
- **Real-time Transfer Speed**: Monitor current transfer speed (KB/s, MB/s)
- **Data Statistics**: Track total data sent, received, and files transferred
- **Persistent Storage**: Statistics saved across browser sessions using localStorage
- **Mini Dashboard**: Collapsible stats panel with clean interface

### Performance Features
- ⚡ **Transfer Speed Monitoring**: Real-time and average speed calculations
- 📊 **Data Tracking**: Total sent, received, and file count statistics
- 💾 **Persistent Stats**: Data preserved across browser sessions
- 📱 **Mobile Responsive**: Optimized for all screen sizes
- 🎛️ **Interactive Dashboard**: Collapsible stats panel with reset functionality

## Usage

1. **Upload Files**: 
   - Drag files onto the upload area or click "Choose Files"
   - View selected files with their sizes

2. **Share Files**:
   - Generate share links for easy distribution
   - Use QR codes for quick mobile sharing

3. **Monitor Performance**:
   - View real-time transfer speeds in the stats dashboard
   - Track cumulative data sent and received
   - Monitor total files transferred

4. **Manage Statistics**:
   - Reset all statistics with the "Reset" button
   - Hide/show the stats dashboard as needed
   - Statistics persist across browser sessions

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (no dependencies)
- **Storage**: localStorage for persistent statistics
- **Design**: Modern gradient UI with smooth animations
- **Performance**: Optimized for fast loading and smooth interactions

## Statistics Dashboard

The mini dashboard displays:
- **Speed**: Current transfer speed
- **📤 Sent**: Total data uploaded
- **📥 Received**: Total data downloaded  
- **📁 Files**: Total files transferred

### Controls
- **Reset**: Clear all statistics
- **Hide**: Hide the dashboard
- **Collapse/Expand**: Toggle dashboard visibility

## Keyboard Shortcuts
- `Ctrl+S`: Toggle stats dashboard
- `Ctrl+R`: Reset statistics

## Screenshots

### Desktop View
![Desktop Interface](https://github.com/user-attachments/assets/6d6217fa-8cf0-4ff1-b729-e4ddf8b7e546)

### Mobile View
![Mobile Interface](https://github.com/user-attachments/assets/08999a16-d622-46b8-bf1f-39d1d863901a)

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser
3. Or serve with a local server:
   ```bash
   python3 -m http.server 8000
   ```
4. Navigate to `http://localhost:8000`

## File Structure

```
quick-file-transfer/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── script.js           # JavaScript functionality
└── README.md          # Documentation
```

## Browser Support

- Modern browsers with JavaScript enabled
- localStorage support required for persistent statistics
- File API support for file uploads

## License

MIT License - feel free to use and modify as needed.