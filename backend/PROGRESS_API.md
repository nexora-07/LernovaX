# Course Progress API

Base URL: `http://localhost:8000/api/v1`

Progress is stored on the student's enrollment. These endpoints require a student bearer token from login; students can only read or update their own progress. The course model does not currently contain lessons, so the client supplies stable lesson IDs and the current total lesson count.

## Get course progress

`GET {{baseURL}}/enrollments/{{courseId}}/progress`

Header: `Authorization: Bearer <token>`

Returns `200 OK` with the completed lesson IDs, total lesson count, percentage, and last update time. Returns `404` if the signed-in student is not enrolled in the course or the enrollment is cancelled.

## Update a lesson's completion

`PATCH {{baseURL}}/enrollments/{{courseId}}/progress`

Header: `Authorization: Bearer <token>`

JSON body:

```json
{
  "lessonId": "lesson-1",
  "completed": true,
  "totalLessons": 12
}
```

Use `completed: false` to undo completion. Repeating the same update is safe and does not duplicate a lesson ID. `totalLessons` must be a positive integer, cannot be less than the number of completed lessons, and cannot change after progress starts. If the course lesson count changes, handle that as a deliberate progress reset rather than changing it from a student request.

Successful responses use this shape:

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

Invalid input returns `400`, missing authentication returns `401`, and non-student accounts return `403`.