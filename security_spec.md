# Security Specification — Phrase juste

## 1. Access Control Model
- **Default Deny**: All paths not explicitly matched are denied read/write access.
- **Per-User Ownership (`/users/{userId}`)**:
  - Only the authenticated owner (`request.auth != null && request.auth.uid == userId`) or a verified admin can read, create, or update `/users/{userId}`.
  - Users can never list or read other users' documents.
- **Connection Test (`/_connection_test_/ping`)**:
  - Read-only access allowed to verify client-to-Firestore connectivity at startup (`getDocFromServer`). Writes are strictly denied.

## 2. Data Validation & Invariants
- `uid` must be a string equal to `userId` and `request.auth.uid`, and cannot be modified on update.
- `settingsJson` must be a string with length between 2 and 10,000 characters.
- `progressJson` must be a string with length between 2 and 100,000 characters.
- `xp` must be a non-negative integer (`>= 0` and `<= 1000000`).
- `streakDays` must be a non-negative integer (`>= 0` and `<= 3650`).
- `updatedAt` must be an ISO-formatted string of reasonable length (`<= 64`).
