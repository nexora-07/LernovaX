# Enrollment API

Base URL: `http://localhost:5000/api/v1`

All endpoints below require a signed-in student. In Postman, choose **Bearer Token** authorization and paste the token returned by student sign-in. Endpoints use the signed-in student's account, so do not send a `studentId`.

## Enroll in a course

`POST {{baseURL}}/enrollments`

JSON body:

```json
{
  "courseId": "<courseId>"
}
```

Returns `201 Created` with the enrollment. Returns `404` if the course does not exist, or `409` if the student is already enrolled in the course.

## Get a student's enrollments

`GET {{baseURL}}/enrollments`

Returns `200 OK` with an `enrollments` array and a `results` count.

## Update enrollment status

`PATCH {{baseURL}}/enrollments/{{courseId}}`

JSON body:

```json
{
  "status": "completed"
}
```

Allowed statuses are `active`, `completed`, and `cancelled`; `status` is required. Returns `200 OK` with the updated enrollment, or `404` if no matching enrollment exists.

## Cancel an enrollment

`PATCH {{baseURL}}/enrollments/{{courseId}}/cancel`

No request body is required. This sets the enrollment status to `cancelled` and returns `200 OK` with the updated enrollment, or `404` if no matching enrollment exists.

## Common errors

Errors use a JSON response with `status: "failed"` and a message. A missing or invalid `courseId`, or a missing/invalid `status` on update, returns `400 Bad Request`. Use the actual course `_id` from MongoDB, not the placeholder text `<courseId>`. Requests without a valid token return `401 Unauthorized`; non-student accounts return `403 Forbidden`.

For Postman, define `baseURL` as `http://localhost:5000/api/v1` and `courseId` as a real MongoDB `_id` value in the selected environment. Select **Bearer Token** authorization and paste the token returned by student sign-in.