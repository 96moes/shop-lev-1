# Task 18: Configure frontend API settings

## Goal

Configure a shared frontend API client using an environment-specific base URL.

## Work

- Add a frontend `.env` file containing:

```env
VITE_API_URL=http://localhost:3000/api
```

- Configure a shared Axios client to read this setting.

## Done when

- [ ] Frontend API requests use the configured base URL.
- [ ] Environment-specific URLs are not hard-coded in application code.

Previous: [Task 17: Configure Swagger/OpenAPI](./implementation-part-1-task-17-swagger-openapi.md)  
Next: [Task 19: Configure backend environment variables](./implementation-part-1-task-19-backend-environment.md).
