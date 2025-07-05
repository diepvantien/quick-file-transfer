# Quick File Transfer

## Mô tả
Ứng dụng chuyển file nhanh chóng với tích hợp QR Code Pro và WebRTC P2P. Người dùng có thể tạo phòng, chia sẻ QR code để mời người khác tham gia, và chuyển file trực tiếp qua kết nối P2P an toàn.

## Tính năng chính

### 🔗 Tích hợp QR Code Pro
- Tự động tạo QR code khi tạo phòng
- QR code chứa link tham gia phòng
- Hỗ trợ copy và download QR code
- Responsive design cho mobile

### 📁 WebRTC P2P File Transfer
- Chuyển file trực tiếp giữa các thiết bị
- Không cần server trung gian
- Hỗ trợ multiple files
- Real-time progress tracking
- Drag & drop interface

### 🏠 Quản lý phòng
- Tạo phòng với tên tùy chọn
- Mã phòng ngẫu nhiên
- Tham gia phòng bằng QR code hoặc link
- Hiển thị danh sách người tham gia

### 📱 Responsive Design
- Tối ưu cho mobile devices
- Giao diện thân thiện
- Hỗ trợ touch gestures

## Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy server
```bash
npm start
```

### 3. Chạy trong development mode
```bash
npm run dev
```

### 4. Truy cập ứng dụng
Mở trình duyệt và truy cập: `http://localhost:3000`

## Cấu trúc dự án

```
/
├── public/
│   ├── index.html          # Trang chủ
│   ├── room.html           # Trang phòng transfer
│   ├── css/
│   │   └── style.css       # Styles chính
│   ├── js/
│   │   ├── app.js          # Logic trang chủ
│   │   ├── room.js         # Logic phòng transfer
│   │   └── qr-generator.js # QR code generator từ QR-Code-Pro
│   └── lib/
│       └── simple-peer.min.js  # WebRTC library
├── server.js               # Server Node.js
├── package.json           # Dependencies
└── README.md              # Hướng dẫn sử dụng
```

## Cách sử dụng

### Tạo phòng mới
1. Truy cập trang chủ
2. Nhập tên phòng (tùy chọn) hoặc để trống
3. Nhấn "Tạo phòng"
4. QR code sẽ được tạo tự động

### Tham gia phòng
1. Scan QR code bằng camera
2. Hoặc nhập mã phòng/link phòng
3. Nhấn "Tham gia"

### Chuyển file
1. Kéo thả file vào vùng drop zone
2. Hoặc nhấn để chọn file
3. Nhấn "Gửi" để chuyển file
4. File sẽ được chuyển trực tiếp P2P

## Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express
- **WebRTC**: Simple-peer library
- **Socket.io**: Real-time signaling
- **QR Code**: Tích hợp từ QR-Code-Pro
- **Icons**: Font Awesome

## Tích hợp QR-Code-Pro

Ứng dụng tích hợp QR code generator từ dự án [QR-Code-Pro](https://github.com/diepvantien/QR-Code-Pro) với các tính năng:

- Tạo QR code cho link phòng
- Tùy chỉnh kích thước QR code
- Copy QR code vào clipboard
- Download QR code dưới dạng PNG
- Hiển thị responsive trên mobile

## API Endpoints

- `GET /` - Trang chủ
- `GET /room.html` - Trang phòng
- `GET /api/rooms` - Danh sách phòng
- `GET /api/rooms/:roomId` - Thông tin phòng
- `GET /health` - Health check

## Socket.io Events

### Client → Server
- `create-room` - Tạo phòng mới
- `join-room` - Tham gia phòng
- `leave-room` - Rời phòng
- `webrtc-signal` - WebRTC signaling
- `get-room-info` - Lấy thông tin phòng

### Server → Client
- `room-created` - Phòng đã được tạo
- `room-joined` - Đã tham gia phòng
- `room-info` - Thông tin phòng
- `participant-joined` - Có người tham gia
- `participant-left` - Có người rời phòng
- `webrtc-signal` - WebRTC signaling
- `room-error` - Lỗi phòng

## Bảo mật

- WebRTC P2P: File chuyển trực tiếp giữa các thiết bị
- Không lưu trữ file trên server
- Mã hóa end-to-end
- Tự động xóa phòng khi không sử dụng

## Tác giả

**Diệp Văn Tiến**
- GitHub: [@diepvantien](https://github.com/diepvantien)
- Email: diepvantien@example.com

## Giấy phép

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

---

© 2025 Diệp Văn Tiến. Powered by QR-Code-Pro