# Task 19: Configure backend environment variables

## Goal

Load backend configuration from the environment instead of hard-coding it.

## Work

Add these variables to the backend development environment:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000
```

- Load environment variables using the project's chosen NestJS configuration approach.
- Keep real secrets out of source control.

## Done when

- [ ] The backend reads its configuration from the environment.
- [ ] The backend starts with local development values.
- [ ] Real secrets are not committed.

Previous: [Task 18: Configure frontend API settings](./implementation-part-1-task-18-frontend-api-settings.md)  
Next: [Task 20: Verify the foundation](./implementation-part-1-task-20-verify-foundation.md).
