# Online Virtual Classroom - Implementation Documentation

## Project Overview

An online virtual classroom application with role-based access (Student, Teacher, Admin), user authentication, profile management, and an admin panel for managing system data.

---

## 📋 Implementation Summary

### **Phase 1: Authentication & Profile Management**

#### Features Implemented:

1. **User Authentication System**

   - Signup/Signin with JWT tokens
   - Email-based login for all user types
   - Password hashing with bcryptjs
   - Token persistence in localStorage

2. **User Roles Support**

   - **Student**: Roll number (dynamically constructed), email required
   - **Teacher**: Email required only
   - **Admin**: Full system access

3. **Profile Management**

   - Profile image upload via server-side Cloudinary integration
   - Profile editing (name, email, image)
   - Profile viewing with role display
   - Editable profile mode with save/cancel

4. **Navigation Features**
   - Profile icon links to profile page
   - Dashboard sidebar navigation
   - Protected routes (login required)
   - Role-based admin panel access

---

### **Phase 2: Advanced Roll Number System with Admin Panel**

#### What Was Changed:

##### **Backend Changes:**

1. **Models Created:**

   - **`models/Year.js`**: Stores academic years (code: "FA22", label: "Fall 2022")
   - **`models/Department.js`**: Stores departments (code: "BCS", label: "Bachelor of Computer Science")

2. **User Model Refactored** (`models/User.js`):

   - **Old**: Single `rollNumber` field (text input)
   - **New**: Three separate fields:
     - `rollYear`: Academic year (e.g., "FA22")
     - `rollDept`: Department code (e.g., "BCS")
     - `rollSerial`: Serial/Roll number (e.g., "255")
   - **Auto-construction**: Pre-save MongoDB hook constructs full `rollNumber = rollYear + rollDept + rollSerial` (lowercase)
   - Example: FA22 + BCS + 255 → `fa22bcs255`

3. **Admin Controller Created** (`controllers/adminController.js`):

   - **Years CRUD**:

     - `getYears()`: Fetch all years (public)
     - `createYear()`: Add new year (admin only)
     - `updateYear()`: Modify year (admin only)
     - `deleteYear()`: Remove year (admin only)

   - **Departments CRUD**:

     - `getDepartments()`: Fetch all departments (public)
     - `createDepartment()`: Add new department (admin only)
     - `updateDepartment()`: Modify department (admin only)
     - `deleteDepartment()`: Remove department (admin only)

   - **Users CRUD**:
     - `getUsers()`: List all users (admin only)
     - `getUserById()`: Get specific user (admin only)
     - `updateUser()`: Modify user details (admin only)
     - `deleteUser()`: Remove user (admin only)

4. **Admin Middleware Created** (`middlewares/adminAuth.js`):

   - Verifies JWT token from Authorization header
   - Checks if user role is "admin"
   - Returns 403 Forbidden if not admin
   - Used to protect all admin write/delete operations

5. **Admin Routes Created** (`routes/admin.js`):

   ```
   GET    /api/admin/years          (public)
   POST   /api/admin/years          (admin only)
   PUT    /api/admin/years/:id      (admin only)
   DELETE /api/admin/years/:id      (admin only)

   GET    /api/admin/departments    (public)
   POST   /api/admin/departments    (admin only)
   PUT    /api/admin/departments/:id   (admin only)
   DELETE /api/admin/departments/:id   (admin only)

   GET    /api/admin/users          (admin only)
   GET    /api/admin/users/:id      (admin only)
   PUT    /api/admin/users/:id      (admin only)
   DELETE /api/admin/users/:id      (admin only)
   ```

6. **Auth Controller Updated** (`controllers/authController.js`):

   - `signup()`: Now accepts rollYear, rollDept, rollSerial for students
   - `signin()`: Returns role and roll components in response
   - `updateProfile()`: Returns role and roll components in response

7. **App.js Updated**:
   - Mounted admin routes: `app.use("/api/admin", adminRoutes)`

##### **Frontend Changes:**

1. **Auth Context Updated** (`context/AuthContext.jsx`):

   - `signup()` method sends `role`, `rollYear`, `rollDept`, `rollSerial` separately
   - Supports both student and teacher signup flows
   - Login uses email as identifier for both roles

2. **Signup Page Completely Refactored** (`pages/SignupPage.jsx`):

   - Added **Role Selector**: Dropdown to choose "Student" or "Teacher"
   - Added **Dynamic Dropdowns**:
     - Fetches Years and Departments from `/api/admin/years` and `/api/admin/departments` on page load
     - Students see three fields: Year dropdown, Department dropdown, Serial input
     - Teachers see only email field
   - **Validation**:
     - Students: Must select Year, Department, enter Serial, name, email, password
     - Teachers: Must enter name, email, password only
   - **Visual Layout**: 3-column grid for student roll fields, clean conditional rendering

3. **Admin Panel Created** (`pages/AdminPanel.jsx`) - New Component:

   - **Tab-based UI** with 3 sections:

   - **Years Tab**:

     - Form to add new year (code + label inputs)
     - List of all years with delete buttons
     - Real-time fetch from backend

   - **Departments Tab**:

     - Form to add new department (code + label inputs)
     - List of all departments with delete buttons
     - Real-time fetch from backend

   - **Users Tab**:

     - Table showing all users (Name, Email, Roll Number, Role columns)
     - Delete buttons for each user
     - Responsive table design

   - **Access Control**:
     - Admin-only access (redirects non-admins away)
     - Requires admin Bearer token for all operations
     - Toast notifications for success/error feedback

4. **App.jsx Updated**:
   - Added AdminPanel component import
   - Added route: `/admin` → AdminPanel component

---

## 🗂️ File Structure

### Backend Files

```
Backend/
├── models/
│   ├── User.js           (MODIFIED - added rollYear, rollDept, rollSerial, pre-save hook)
│   ├── Year.js           (NEW - academic years)
│   └── Department.js     (NEW - departments)
├── controllers/
│   ├── authController.js (MODIFIED - signup/signin updated for new roll format)
│   └── adminController.js (NEW - CRUD for Years, Departments, Users)
├── middlewares/
│   └── adminAuth.js      (NEW - JWT + role check for admin endpoints)
├── routes/
│   └── admin.js          (NEW - 12 admin endpoints)
└── app.js                (MODIFIED - mounted admin routes)
```

### Frontend Files

```
Frontend/src/
├── context/
│   └── AuthContext.jsx   (MODIFIED - signup sends role and roll components)
├── pages/
│   ├── SignupPage.jsx    (MODIFIED - role selector, roll dropdowns, conditional rendering)
│   └── AdminPanel.jsx    (NEW - tabs for Years, Departments, Users management)
└── App.jsx               (MODIFIED - added /admin route)
```

---

## 🔑 Key Features Explained

### 1. **Roll Number Construction**

- **Before**: Users entered "fa22bcs255" in a single text field
- **After**: Three separate dropdowns/inputs (Year, Department, Serial) that auto-construct to "fa22bcs255"
- **Benefit**: Admin can manage available years and departments centrally; ensures data consistency

### 2. **Admin Panel**

- Allows administrators to:
  - Add/edit/delete academic years
  - Add/edit/delete departments
  - View/manage/delete users
- All operations protected by adminAuth middleware (requires admin JWT token)

### 3. **Role-Based Signup**

- **Student signup**: Year + Department + Serial (creates constructed rollNumber)
- **Teacher signup**: Just email (no roll number)
- **Admin signup**: Same as teacher but with admin role (created manually or via special endpoint)

### 4. **Authentication Flow**

1. User selects role on signup page
2. For students: selects Year/Dept from dropdowns, enters Serial
3. Form sends role + roll components to backend
4. Backend constructs rollNumber and stores all fields
5. On login: email identifies user, returns token + user data with role
6. Token stored in localStorage for session persistence

---

## 📝 Technical Specifications

### Database Schema

**User Model:**

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, bcrypt hashed),
  role: String ("student" | "teacher" | "admin", default: "student"),
  rollYear: String (e.g., "FA22", for students only),
  rollDept: String (e.g., "BCS", for students only),
  rollSerial: String (e.g., "255", for students only),
  rollNumber: String (auto-constructed: rollYear+rollDept+rollSerial lowercase, unique & sparse),
  profileImage: String (Cloudinary URL),
  timestamps: true
}
```

**Year Model:**

```javascript
{
  code: String (unique, e.g., "FA22"),
  label: String (e.g., "Fall 2022"),
  timestamps: true
}
```

**Department Model:**

```javascript
{
  code: String (unique, e.g., "BCS"),
  label: String (e.g., "Bachelor of Computer Science"),
  timestamps: true
}
```

### API Endpoints

#### Public Endpoints

- `GET /api/admin/years` - Fetch all academic years
- `GET /api/admin/departments` - Fetch all departments

#### Protected (Admin Only) Endpoints

- `POST /api/admin/years` - Create year
- `PUT /api/admin/years/:id` - Update year
- `DELETE /api/admin/years/:id` - Delete year
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/:id` - Update department
- `DELETE /api/admin/departments/:id` - Delete department
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

---

## 🚀 How to Use

### For Students

1. **Signup**: Select "Student" role → Choose Year, Department, enter Serial
2. **Login**: Use email and password
3. **Profile**: View auto-constructed roll number (e.g., fa22bcs255)

### For Teachers

1. **Signup**: Select "Teacher" role → Only need email and password
2. **Login**: Use email and password
3. **Profile**: No roll number displayed

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` (if logged in as admin)
2. **Manage Years**: Add/delete academic years
3. **Manage Departments**: Add/delete departments
4. **Manage Users**: View and delete user accounts

---

## ✅ Testing Checklist

- [ ] Backend server starts without errors
- [ ] MongoDB connection successful
- [ ] Admin routes accessible (GET /api/admin/years returns [])
- [ ] Frontend compiles without errors
- [ ] Create admin user (manual or via endpoint)
- [ ] Login as admin and access `/admin` panel
- [ ] Add a Year from admin panel
- [ ] Add a Department from admin panel
- [ ] Verify dropdowns populate on `/signup` page
- [ ] Student signup with Year/Dept/Serial works
- [ ] Constructed roll number appears on profile (fa22bcs255 format)
- [ ] Teacher signup works (no roll number fields)
- [ ] Admin can delete users from admin panel
- [ ] All toast notifications display correctly
- [ ] Protected routes redirect non-authenticated users to login

---

## 🔒 Security Features

1. **JWT Authentication**: All endpoints protected by token verification
2. **Admin Middleware**: Role-based access control for admin operations
3. **Password Hashing**: bcryptjs used for password security
4. **Unique Email**: Email field indexed and unique
5. **Sparse Unique Index**: rollNumber allows NULL for teachers
6. **Token Expiry**: Implement token refresh (if configured)

---

## 📌 Important Notes

1. **Initial Admin User**: Must be created manually (either direct MongoDB insert or temporary signup endpoint with env check)
2. **Years/Departments**: Must be added via admin panel before students can use them
3. **Roll Number Format**: Automatically lowercase (FA22BCS255 → fa22bcs255)
4. **Cloudinary**: Configure .env with CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
5. **JWT Secret**: Set JWT_SECRET in .env for token signing

---

## 📦 Dependencies

### Backend

- express
- mongoose
- bcryptjs
- jsonwebtoken
- multer
- streamifier
- cloudinary

### Frontend

- react 18+
- vite
- axios
- react-toastify
- framer-motion
- lucide-react
- tailwindcss

---

## 🎯 Future Enhancements

1. Edit/update years and departments (currently only delete)
2. Edit user information from admin panel
3. Export user list to CSV
4. Search/filter users in admin panel
5. Pagination for large user lists
6. Role-based dashboard views (different for student/teacher/admin)
7. Activity logs for admin actions
8. Email verification on signup

---

## 📞 Support

For issues or questions about the implementation, refer to the code comments and console logs during development.

---

**Last Updated**: November 24, 2025
**Status**: Feature Complete - Ready for Testing
