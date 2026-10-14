# LernovaX Backend API

This is the frontend integration reference for the API currently implemented by
the backend. It documents the mounted Express routes and their current request
and response behavior.

## Base URL and conventions

The API prefix is `/api/v1`. Set `API_BASE_URL` to the backend origin plus that
prefix. For example, if the backend runs locally on port 5000:

```text
http://localhost:5000/api/v1
```

The server uses `PORT` when configured, or defaults to port `5000`. Do not
hard-code a local or production host in shared application code; use the
environment-specific frontend configuration.

- JSON endpoints use `Content-Type: application/json`.
- Protected endpoints require `Authorization: Bearer <token>`.
- IDs in URL paths are MongoDB ObjectId strings unless noted otherwise.
- There is currently no pagination or server-side filtering on list endpoints.
- Responses are not fully standardized: auth/course endpoints generally return
  `status` and nested `data`, while lesson/material endpoints generally return
  `success`, `message`, and/or `data`.

The root routes `GET /` and `GET /api/v1` are health/welcome routes. They return
HTTP 200 with `{ "status": "successful", "message": "Welcome to LernovaX backend" }`.

## Authentication

### Bearer token

Successful login returns a JWT in `data.token`. Send it on protected requests:

```http
Authorization: Bearer <token>
```

The token lifetime defaults to seven days and can be configured by the backend
with `JWT_EXPIRES`. A missing or invalid token returns HTTP 401. An authenticated
account with the wrong role returns HTTP 403.

### Sign up

All signup endpoints accept JSON and require:

| Field | Type | Notes |
|---|---|---|
| `firstname` | string | Required, non-empty |
| `lastname` | string | Required, non-empty |
| `email` | string | Required, valid email; normalized to lowercase |
| `phone` | string | Required; 10–15 characters from digits, `+`, `-`, spaces, parentheses |
| `password` | string | Required; at least 8 characters and at most 72 UTF-8 bytes |
| `confirmPassword` | string | Must exactly match `password` |

`role` is assigned by the endpoint; clients cannot select it in the body.

| Method | Path | Account role | Additional fields |
|---|---|---|---|
| POST | `/auth/signup` | student | None |
| POST | `/auth/signup/instructor` | instructor | `instructorId` (required) |
| POST | `/auth/signup/admin` | admin | `adminId` (required) |

Example student signup:

```json
{
  "firstname": "Ada",
  "lastname": "Lovelace",
  "email": "ada@example.com",
  "phone": "+1 555 010 0100",
  "password": "example-password",
  "confirmPassword": "example-password"
}
```

Signup returns HTTP 201 with `status`, `message`, and `data.user`. It sends an
email verification code, which expires after 10 minutes. Signup does **not**
return a JWT; sign in after signup to obtain one.

**Deployment/security note:** instructor and admin signup routes are currently
public and the controller does not validate a signup code. Do not expose these
routes as open staff-registration flows. Restrict staff account creation at the
deployment/application level until the backend enforces an appropriate
authorization policy.

### Verify email

`POST /auth/verify-email` is public and accepts:

```json
{
  "email": "ada@example.com",
  "otp": "<code received by email>"
}
```

Returns HTTP 200 with `{ "status": "success", "message": "Email verified successfully" }`.
Invalid, expired, or missing codes return an error. Current login handlers do
not check `emailVerified`; the frontend should still guide the user through the
verification flow after signup.

### Sign in

| Method | Path | Required JSON fields |
|---|---|---|
| POST | `/auth/login` | `email`, `password` (student) |
| POST | `/auth/login/instructor` | `email`, `password`, `instructorId` |
| POST | `/auth/login/admin` | `email`, `password`, `adminId` |

Successful login returns HTTP 200:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "<userId>",
      "firstname": "Ada",
      "lastname": "Lovelace",
      "email": "ada@example.com",
      "phone": "+1 555 010 0100",
      "role": "student",
      "createdAt": "<ISO date>"
    },
    "token": "<JWT>"
  }
}
```

Staff IDs are normalized to uppercase. A bad credential set returns HTTP 401.
Authentication endpoints are limited to 10 requests per IP per 15 minutes.

### Current account

`GET /auth/me` requires a bearer token and returns HTTP 200 with
`{ "status": "success", "data": { "user": <public user> } }`.

## Courses

Course reads are public. Create, update, and delete require an instructor or
admin token. Instructors may only update or delete their own courses; admins
may manage any course.

| Method | Path | Auth |
|---|---|---|
| POST | `/courses/createcourse` | instructor or admin |
| GET | `/courses/getallcourses` | Public |
| GET | `/courses/getcoursesbyid/:id` | Public |
| PATCH | `/courses/updatecourses/:id` | instructor or admin |
| DELETE | `/courses/deletecourse/:id` | instructor or admin |

Course fields:

| Field | Type | Behavior |
|---|---|---|
| `title` | string | Required; unique across courses |
| `description` | string | Required |
| `category` | string | Required |
| `price` | number | Defaults to `0` |
| `thumbnail` | string | Optional URL/string; defaults to `""` |
| `isPublished` | boolean | Defaults to `false`; may be changed by update |
| `instructor` | ObjectId | Set from the authenticated account on create; do not send |

Example create body:

```json
{
  "title": "Introduction to Algebra",
  "description": "A beginner course.",
  "category": "Mathematics",
  "price": 0,
  "thumbnail": "https://example.com/course-thumbnail.jpg"
}
```

Create returns HTTP 201 and `{ "status": "successful", "data": { "course": ... } }`.
List returns HTTP 200 and `{ "status": "successful", "data": { "courses": [...] } }`.
Details and update return the same shape with one `course`. Delete returns HTTP
204 with no response body. The list currently includes all courses; it does not
filter unpublished courses.

## Lessons

Read endpoints are public. Create, update, and delete require an instructor or
admin token. The current lesson endpoints do not enforce course ownership for
staff.

| Method | Path | Auth |
|---|---|---|
| POST | `/lessons/createlesson` | instructor or admin |
| GET | `/lessons/` | Public |
| GET | `/lessons/:id` | Public |
| PATCH | `/lessons/:id` | instructor or admin |
| DELETE | `/lessons/:id` | instructor or admin |

Lesson create requires:

```json
{
  "title": "Lesson 1",
  "description": "Lesson introduction.",
  "course": "<course ObjectId>",
  "order": 1
}
```

Lesson titles must be unique within a course. Create returns HTTP 201 with
`{ "success": true, "message": "...", "data": <lesson> }`. List returns
`{ "success": true, "data": [...] }`; it returns lessons across all courses.
Use the `course` field to filter client-side. Details/update return one lesson
under `data`; delete returns HTTP 200 with a success message.

## Materials

Material reads are public. Create, update, and delete require an instructor or
admin token. Staff ownership of the parent course is not checked by these
routes.

| Method | Path | Auth |
|---|---|---|
| POST | `/materials/create-material` | instructor or admin |
| GET | `/materials/all` | Public |
| GET | `/materials/lesson/:lessonId` | Public |
| GET | `/materials/:id` | Public |
| PATCH | `/materials/:id` | instructor or admin |
| DELETE | `/materials/:id` | instructor or admin |

Material fields:

| Field | Type | Notes |
|---|---|---|
| `title` | string | Required; unique within its lesson |
| `type` | string | One of `pdf`, `video`, `audio`, `image`, `document`, `link` |
| `lesson` | ObjectId | Required parent lesson |
| `material_file` | string or file | For links, a valid HTTP(S) URL; for uploads, the uploaded file |

### Create a link material

Send JSON (no file):

```json
{
  "title": "Reference website",
  "type": "link",
  "material_file": "https://example.com/resource",
  "lesson": "<lesson ObjectId>"
}
```

### Upload material file(s)

Send `multipart/form-data`, with these text fields and file field:

| Form field | Value |
|---|---|
| `lesson` | Lesson ObjectId |
| `title` | Material title; can be repeated for multiple files |
| `type` | Material type; can be repeated for multiple files |
| `material_file` | File; can include up to 3 files |

The backend accepts files up to 10 MB each. Supported extensions are JPG/JPEG,
PNG, PDF, common audio formats (MP3, WAV, OGG, OGA, M4A, AAC, FLAC), and common
video formats (MP4, WEBM, MOV, AVI, MKV, MPEG, MPG, M4V). File MIME types must
also match the upload filter. Files are uploaded to Cloudinary under
`LernovaX_LMS/Materials`; the saved `material_file` is the returned secure URL.

For multiple files, provide a title and type for each file, or one shared title
and one shared type. A single title is automatically suffixed with `- 1`, `- 2`,
etc. for multiple uploaded files. Uploaded file types cannot be `link`.

Create returns HTTP 201 with `success`, `message`, and `data` (an array of
materials). GET all returns an array in `data`; GET by lesson returns an array
in `data`; GET by ID returns one material in `data`.

### Update and delete

`PATCH /materials/:id` accepts either JSON or multipart form data. For a link,
send `type: "link"` and a valid HTTP(S) `material_file`. For a file replacement,
send `type` and a new `material_file` file in multipart form data. To update
metadata without replacing a file, send `title` and/or `type` without an upload.
Update returns the updated material under `data`. Delete returns HTTP 200 with a
success message.

Deleting a material removes its database record; the current controller does
not remove its uploaded asset from Cloudinary.

Deleting a lesson does not delete its materials, and deleting a course does not
delete its lessons or enrollments. The frontend should not assume cascading
deletion.

## Enrollments

All enrollment routes require a student bearer token. The student identity is
read from the token; do not send `studentId`. Admin and instructor tokens
receive HTTP 403.

| Method | Path | Purpose |
|---|---|---|
| POST | `/enrollments/` | Enroll in a course |
| GET | `/enrollments/` | List the signed-in student's enrollments |
| PATCH | `/enrollments/:courseId` | Update enrollment status |
| PATCH | `/enrollments/:courseId/cancel` | Set status to `cancelled` |

Enroll body:

```json
{
  "courseId": "<course ObjectId>"
}
```

Enrollment returns HTTP 201 with
`{ "status": "success", "data": { "enrollment": ... } }`. The student/course
pair must be unique; duplicate enrollment returns HTTP 409. A missing course
returns HTTP 404.

List returns HTTP 200 with `status: "success"`, `results`, and
`data.enrollments`. Each enrollment includes its populated course summary.

Status update body:

```json
{
  "status": "active"
}
```

Allowed status values are `active`, `completed`, and `cancelled`. A successful
status update or cancellation returns HTTP 200 with the updated enrollment
under `data.enrollment`. Invalid IDs/statuses return HTTP 400; no matching
enrollment returns HTTP 404.

## Course progress

These endpoints are included under `/enrollments` and require a student token.
Progress belongs to the signed-in student's enrollment; cancelled or missing
enrollments return HTTP 404.

| Method | Path | Purpose |
|---|---|---|
| GET | `/enrollments/:courseId/progress` | Read progress |
| PATCH | `/enrollments/:courseId/progress` | Mark/unmark a lesson |

Update body:

```json
{
  "lessonId": "lesson-1",
  "completed": true,
  "totalLessons": 12
}
```

`lessonId` must be a non-empty string (maximum 200 characters), `completed`
must be boolean, and `totalLessons` must be a positive integer. `totalLessons`
cannot change after progress starts. Send `completed: false` to undo completion.
Repeating an update does not duplicate the lesson ID.

Successful requests return HTTP 200 with:

```json
{
  "status": "success",
  "data": {
    "progress": {
      "courseId": "<courseId>",
      "completedLessons": ["lesson-1"],
      "totalLessons": 12,
      "progressPercentage": 8,
      "isComplete": false,
      "startedAt": "<ISO date>",
      "completedAt": null,
      "lastLessonId": "lesson-1",
      "updatedAt": "<ISO date>"
    }
  }
}
```

The progress controller accepts lesson IDs as strings and does not verify that
they refer to lessons in the requested course. The frontend should send the
actual lesson `_id` consistently and provide the current course lesson count.

## Error handling

Typical status codes:

| Status | Meaning |
|---|---|
| 400 | Invalid request data, ID, or status |
| 401 | Missing/invalid/expired bearer token or invalid credentials |
| 403 | Signed-in role is not allowed |
| 404 | Requested course, lesson, material, or enrollment not found |
| 409 | Duplicate course/material/enrollment or conflicting progress update |
| 413 | JSON request body exceeds the 16 KB parser limit |
| 429 | Authentication rate limit exceeded |
| 500 | Server, database, or external service error |

Error bodies generally contain a `message`. The global error handler uses
`{ "status": "fail" | "error", "message": "..." }`; some lesson/material
controllers return `{ "success": false, "message": "..." }` instead. Frontend
error handling should use the HTTP status and treat `message` as optional
display text rather than depending on one response envelope.

## Frontend integration notes

- Public GET routes can be used before login; mutations and enrollment/progress
  routes have the role requirements listed above.
- Course, lesson, and material list routes currently return all matching
  records without pagination.
- Materials can be either external HTTP(S) links or Cloudinary-backed uploads.
- The CORS policy permits the configured `FRONTEND_URL` origin and
  `http://localhost:5173` by default.
- The backend accepts JSON bodies up to 16 KB. File uploads use multipart form
  data and have a 10 MB per-file limit.
- Profile image fields are not currently backed by a mounted profile-image
  upload endpoint.
