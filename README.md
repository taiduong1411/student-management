# Student Management System API Documentation

Hệ thống quản lý sinh viên được xây dựng bằng Node.js + MongoDB.

## Cấu hình

### Environment Variables

Tạo file `.env` trong thư mục root với các biến sau:

```env
MONGODB_URI=mongodb://localhost:27017/student-management
JWT_SECRET=your-secret-key-here
PORT=3000
```

### Khởi động server

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

---

## Authentication

Hầu hết các API yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

Token được trả về khi đăng nhập hoặc đăng ký thành công.

---

## API Endpoints

### 🔐 Account Management (`/api/accounts`)

#### 1. Đăng ký tài khoản

**POST** `/api/accounts/register`

**Body (JSON):**

```json
{
  "email": "student@example.com",
  "password": "password123",
  "displayName": "Nguyễn Văn A"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "account": {
    "id": "...",
    "email": "student@example.com",
    "role": "student",
    "status": "active",
    "displayName": "Nguyễn Văn A"
  }
}
```

---

#### 2. Đăng nhập

**POST** `/api/accounts/login`

**Body (JSON):**

```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "account": {
    "id": "...",
    "email": "student@example.com",
    "role": "student",
    "status": "active",
    "displayName": "Nguyễn Văn A",
    "lastLoginAt": "2025-01-20T10:00:00.000Z"
  }
}
```

---

#### 3. Đăng xuất

**POST** `/api/accounts/logout`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

### 👨‍🎓 Student APIs (`/api/students`)

**Tất cả endpoints yêu cầu authentication (JWT token)**

#### 1. Xem profile của mình

**GET** `/api/students/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "student": {
    "_id": "...",
    "studentId": "SV001",
    "firstName": "Nguyễn",
    "lastName": "Văn A",
    "email": "student@example.com",
    "phone": "0123456789",
    "className": "CNTT2021",
    "faculty": "Công nghệ thông tin",
    "gpa": 3.5,
    ...
  }
}
```

---

#### 2. Cập nhật profile

**PUT** `/api/students/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Body (JSON):**

```json
{
  "phone": "0987654321",
  "personalEmail": "personal@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "dateOfBirth": "2000-01-01",
  "gender": "male"
}
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "student": { ... }
}
```

---

#### 3. Xem danh sách lớp học có sẵn

**GET** `/api/students/classes`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `courseId` (optional): Filter theo course ID
- `semester` (optional): Filter theo học kỳ (ví dụ: "2024-2025-1")
- `status` (optional): Filter theo trạng thái (mặc định: "open")

**Example:**

```
GET /api/students/classes?semester=2024-2025-1&status=open
```

**Response:**

```json
{
  "classOfferings": [
    {
      "_id": "...",
      "classCode": "CS101-01",
      "courseId": {
        "code": "CS101",
        "title": "Lập trình cơ bản",
        "credits": 3
      },
      "semester": "2024-2025-1",
      "instructorName": "Nguyễn Văn B",
      "capacity": 50,
      "enrolledCount": 30,
      "meetings": [
        {
          "dayOfWeek": "monday",
          "startTime": "08:00",
          "endTime": "10:00",
          "room": "A101"
        }
      ]
    }
  ]
}
```

---

#### 4. Đăng ký môn học

**POST** `/api/students/enrollments`

**Headers:**

```
Authorization: Bearer <token>
```

**Body (JSON):**

```json
{
  "classId": "class_offering_id_here",
  "semester": "2024-2025-1"
}
```

**Response:**

```json
{
  "message": "Enrolled successfully",
  "enrollment": {
    "_id": "...",
    "studentId": "...",
    "classId": {
      "classCode": "CS101-01",
      "courseId": {
        "code": "CS101",
        "title": "Lập trình cơ bản"
      }
    },
    "status": "registered",
    "semester": "2024-2025-1"
  }
}
```

---

#### 5. Xem danh sách môn đã đăng ký

**GET** `/api/students/enrollments`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `semester` (optional): Filter theo học kỳ
- `status` (optional): Filter theo trạng thái (registered, completed, dropped)

**Example:**

```
GET /api/students/enrollments?semester=2024-2025-1&status=registered
```

**Response:**

```json
{
  "enrollments": [
    {
      "_id": "...",
      "classId": {
        "classCode": "CS101-01",
        "courseId": {
          "code": "CS101",
          "title": "Lập trình cơ bản",
          "credits": 3
        }
      },
      "status": "registered",
      "semester": "2024-2025-1",
      "registeredAt": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

---

#### 6. Xóa đăng ký môn (Drop)

**DELETE** `/api/students/enrollments/:enrollmentId`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "message": "Dropped successfully"
}
```

---

#### 7. Xem điểm

**GET** `/api/students/grades`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `semester` (optional): Filter theo học kỳ

**Response:**

```json
{
  "grades": [
    {
      "enrollmentId": "...",
      "classCode": "CS101-01",
      "courseCode": "CS101",
      "courseTitle": "Lập trình cơ bản",
      "credits": 3,
      "semester": "2024-2025-1",
      "scoreBreakdown": [
        {
          "label": "Giữa kỳ",
          "score": 8,
          "maxScore": 10,
          "weight": 0.3
        }
      ],
      "finalScore": 8.5,
      "letterGrade": "B+",
      "gradePoint": 3.3,
      "status": "completed"
    }
  ]
}
```

---

#### 8. Tính GPA

**GET** `/api/students/gpa`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "gpa": 3.5,
  "totalCredits": 30,
  "totalPoints": 105,
  "enrollmentsCount": 10
}
```

---

#### 9. Xem thời khóa biểu

**GET** `/api/students/timetable`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `semester` (optional): Filter theo học kỳ (nếu không có sẽ dùng currentSemester của student)

**Response:**

```json
{
  "semester": "2024-2025-1",
  "timetable": [
    {
      "enrollmentId": "...",
      "classCode": "CS101-01",
      "courseCode": "CS101",
      "courseTitle": "Lập trình cơ bản",
      "credits": 3,
      "instructorName": "Nguyễn Văn B",
      "room": "A101",
      "meetings": [
        {
          "dayOfWeek": "monday",
          "startTime": "08:00",
          "endTime": "10:00",
          "room": "A101"
        },
        {
          "dayOfWeek": "wednesday",
          "startTime": "08:00",
          "endTime": "10:00",
          "room": "A101"
        }
      ]
    }
  ]
}
```

---

### 👨‍💼 Admin APIs (`/api/admin`)

**Tất cả endpoints yêu cầu authentication và quyền admin**

#### 📚 Quản lý Sinh viên

##### 1. Tạo sinh viên mới

**POST** `/api/admin/students`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Body (JSON):**

```json
{
  "studentId": "SV001",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "middleName": "Thị",
  "dateOfBirth": "2000-01-01",
  "gender": "male",
  "email": "student@example.com",
  "password": "password123",
  "phone": "0123456789",
  "personalEmail": "personal@example.com",
  "className": "CNTT2021",
  "faculty": "Công nghệ thông tin",
  "cohortYear": 2021,
  "enrollmentYear": 2021,
  "currentSemester": "2024-2025-1"
}
```

**Response:**

```json
{
  "message": "Student created successfully",
  "student": { ... }
}
```

---

##### 2. Lấy danh sách sinh viên

**GET** `/api/admin/students`

**Query Parameters:**

- `className` (optional): Filter theo lớp
- `faculty` (optional): Filter theo khoa
- `status` (optional): Filter theo trạng thái (active, on_leave, suspended, graduated, alumni)
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng mỗi trang (mặc định: 10)

**Example:**

```
GET /api/admin/students?faculty=Công nghệ thông tin&page=1&limit=20
```

---

##### 3. Lấy thông tin chi tiết sinh viên

**GET** `/api/admin/students/:id`

**Path Parameters:**

- `id`: Student ID (MongoDB ObjectId)

---

##### 4. Cập nhật thông tin sinh viên

**PUT** `/api/admin/students/:id`

**Body (JSON):** Tương tự như tạo sinh viên, nhưng không bắt buộc tất cả trường

---

##### 5. Xóa sinh viên

**DELETE** `/api/admin/students/:id`

---

#### 📖 Quản lý Môn học

##### 1. Tạo môn học mới

**POST** `/api/admin/courses`

**Body (JSON):**

```json
{
  "code": "CS101",
  "title": "Lập trình cơ bản",
  "description": "Môn học về lập trình cơ bản",
  "credits": 3,
  "contactHours": 45,
  "subjectArea": "Computer Science",
  "faculty": "Công nghệ thông tin",
  "prerequisites": ["CS100"],
  "syllabusUrl": "https://example.com/syllabus.pdf",
  "status": "active"
}
```

---

##### 2. Lấy danh sách môn học

**GET** `/api/admin/courses`

**Query Parameters:**

- `faculty` (optional): Filter theo khoa
- `subjectArea` (optional): Filter theo lĩnh vực
- `status` (optional): Filter theo trạng thái (active, inactive)
- `page` (optional): Số trang
- `limit` (optional): Số lượng mỗi trang

---

##### 3. Lấy thông tin chi tiết môn học

**GET** `/api/admin/courses/:id`

---

##### 4. Cập nhật môn học

**PUT** `/api/admin/courses/:id`

---

##### 5. Xóa môn học

**DELETE** `/api/admin/courses/:id`

**Lưu ý:** Không thể xóa nếu có class offerings đang sử dụng môn học này

---

#### 🏫 Quản lý Lớp học (Class Offering)

##### 1. Tạo lớp học mới

**POST** `/api/admin/class-offerings`

**Body (JSON):**

```json
{
  "classCode": "CS101-01",
  "courseId": "course_id_here",
  "semester": "2024-2025-1",
  "instructorName": "Nguyễn Văn B",
  "section": "01",
  "room": "A101",
  "campus": "Cơ sở 1",
  "mode": "on_campus",
  "capacity": 50,
  "status": "open",
  "meetings": [
    {
      "dayOfWeek": "monday",
      "startTime": "08:00",
      "endTime": "10:00",
      "room": "A101",
      "building": "Tòa A"
    },
    {
      "dayOfWeek": "wednesday",
      "startTime": "08:00",
      "endTime": "10:00",
      "room": "A101",
      "building": "Tòa A"
    }
  ],
  "notes": "Lớp học buổi sáng"
}
```

**dayOfWeek values:** `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`

**mode values:** `on_campus`, `online`, `hybrid`

**status values:** `scheduled`, `open`, `closed`, `cancelled`

---

##### 2. Lấy danh sách lớp học

**GET** `/api/admin/class-offerings`

**Query Parameters:**

- `courseId` (optional): Filter theo course ID
- `semester` (optional): Filter theo học kỳ
- `status` (optional): Filter theo trạng thái
- `page` (optional): Số trang
- `limit` (optional): Số lượng mỗi trang

---

##### 3. Lấy thông tin chi tiết lớp học

**GET** `/api/admin/class-offerings/:id`

---

##### 4. Cập nhật lớp học

**PUT** `/api/admin/class-offerings/:id`

---

##### 5. Xóa lớp học

**DELETE** `/api/admin/class-offerings/:id`

**Lưu ý:** Không thể xóa nếu có sinh viên đã đăng ký

---

#### 📊 Quản lý Điểm

##### 1. Nhập điểm cho sinh viên

**POST** `/api/admin/enrollments/:enrollmentId/grades`

**Path Parameters:**

- `enrollmentId`: Enrollment ID (MongoDB ObjectId)

**Body (JSON):**

```json
{
  "scoreBreakdown": [
    {
      "label": "Giữa kỳ",
      "score": 8,
      "maxScore": 10,
      "weight": 0.3
    },
    {
      "label": "Cuối kỳ",
      "score": 9,
      "maxScore": 10,
      "weight": 0.7
    }
  ],
  "finalScore": 8.7,
  "letterGrade": "B+",
  "gradePoint": 3.3,
  "notes": "Sinh viên học tốt"
}
```

**Lưu ý:**

- `letterGrade`: A, B+, B, C+, C, D+, D, F
- `gradePoint`: 4.0 (A), 3.5 (B+), 3.0 (B), 2.5 (C+), 2.0 (C), 1.5 (D+), 1.0 (D), 0 (F)
- API sẽ tự động cập nhật GPA của sinh viên

---

##### 2. Xem điểm theo lớp học

**GET** `/api/admin/class-offerings/:classId/grades`

**Path Parameters:**

- `classId`: Class Offering ID

**Response:**

```json
{
  "grades": [
    {
      "enrollmentId": "...",
      "studentId": "SV001",
      "studentName": "Nguyễn Văn A",
      "scoreBreakdown": [...],
      "finalScore": 8.5,
      "letterGrade": "B+",
      "gradePoint": 3.3,
      "status": "completed",
      "gradedAt": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

---

##### 3. Xem danh sách enrollments

**GET** `/api/admin/enrollments`

**Query Parameters:**

- `studentId` (optional): Filter theo student ID
- `classId` (optional): Filter theo class ID
- `semester` (optional): Filter theo học kỳ
- `status` (optional): Filter theo trạng thái
- `page` (optional): Số trang
- `limit` (optional): Số lượng mỗi trang

---

##### 4. Tính GPA cho sinh viên

**GET** `/api/admin/students/:studentId/gpa`

**Path Parameters:**

- `studentId`: Student ID (MongoDB ObjectId)

**Response:**

```json
{
  "studentId": "SV001",
  "studentName": "Nguyễn Văn A",
  "gpa": 3.5,
  "totalCredits": 30,
  "totalPoints": 105,
  "enrollmentsCount": 10
}
```

---

## Error Responses

Tất cả các API có thể trả về các lỗi sau:

### 400 Bad Request

```json
{
  "message": "Student ID, first name and last name are required"
}
```

### 401 Unauthorized

```json
{
  "message": "No token, authorization denied"
}
```

hoặc

```json
{
  "message": "Invalid credentials"
}
```

### 403 Forbidden

```json
{
  "message": "Access denied. Admin only."
}
```

### 404 Not Found

```json
{
  "message": "Student not found"
}
```

### 409 Conflict

```json
{
  "message": "Student ID already exists"
}
```

### 500 Internal Server Error

```json
{
  "message": "Unable to create student"
}
```

---

## Postman Collection Setup

### 1. Tạo Environment trong Postman

Tạo một environment với các variables:

- `base_url`: `http://localhost:3000`
- `token`: (sẽ được set sau khi login)
- `admin_token`: (token của admin account)

### 2. Pre-request Script (cho các API cần auth)

Thêm vào Pre-request Script của request:

```javascript
pm.request.headers.add({
  key: "Authorization",
  value: "Bearer " + pm.environment.get("token"),
});
```

### 3. Test Script (sau khi login)

Thêm vào Test Script của login request:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
}
```

---

## Testing Flow

### 1. Tạo Admin Account

1. Đăng ký account với role admin (hoặc set trực tiếp trong database)
2. Login để lấy token

### 2. Tạo dữ liệu cơ bản (Admin)

1. Tạo môn học (Course)
2. Tạo lớp học (Class Offering)
3. Tạo sinh viên (Student)

### 3. Test Student APIs

1. Login với account sinh viên
2. Xem danh sách lớp học có sẵn
3. Đăng ký môn học
4. Xem thời khóa biểu
5. Xem điểm (sau khi admin nhập điểm)

### 4. Test Admin Grade Management

1. Xem danh sách enrollments
2. Nhập điểm cho sinh viên
3. Xem điểm theo lớp
4. Tính GPA cho sinh viên

---

## Notes

- Tất cả timestamps sử dụng ISO 8601 format
- ObjectId trong MongoDB có thể được sử dụng trực tiếp trong URL
- JWT token có thời hạn 6 giờ
- Pagination mặc định: page=1, limit=10
- Tất cả text search không phân biệt hoa thường (nếu có)
