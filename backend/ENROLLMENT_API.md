# Enrollment API

Base URL: `http://localhost:8000/api/v1`

All endpoints below use the `/enrollments` resource. These examples use MongoDB document `_id` values for `studentId` and `courseId`.

## Enroll in a course

`POST {{baseURL}}/enrollments`

JSON body:

```json
{
  "studentId": "<studentId>",
  "courseId": "<courseId>"
}
```

Returns `201 Created` with the enrollment. Returns `404` if the student or course does not exist, or `409` if that student is already enrolled in the course.

## Get a student's enrollments

`GET {{baseURL}}/enrollments?studentId=<studentId>`

Returns `200 OK` with an `enrollments` array and a `results` count.

## Update enrollment status

`PATCH {{baseURL}}/enrollments/{{courseId}}`

JSON body:

```json
{
  "studentId": "<studentId>",
  "status": "completed"
}
```

Allowed statuses are `active`, `completed`, and `cancelled`. The `studentId` may also be sent as a query parameter. Returns `200 OK` with the updated enrollment, or `404` if no matching enrollment exists.

## Cancel an enrollment

`PATCH {{baseURL}}/enrollments/{{courseId}}/cancel?studentId={{studentId}}`

No request body is required. This sets the enrollment status to `cancelled` and returns `200 OK` with the updated enrollment, or `404` if no matching enrollment exists.

## Common errors

Errors use a JSON response with `status: "failed"` and a message. Missing required IDs return `400 Bad Request`; invalid status values return `400 Bad Request`.

For Postman, define `baseURL` as `http://localhost:8000/api/v1`, and define `studentId` and `courseId` as real MongoDB `_id` values in the selected environment.