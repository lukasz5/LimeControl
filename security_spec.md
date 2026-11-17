# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. Every `LimeInstance` document at `/users/{userId}/instances/{instanceId}` MUST belong to the parent user (`ownerUid == userId == request.auth.uid`), and the parent `/users/{userId}` document MUST exist (`exists(...)` Master Gate).
3. Neither `UserProfile` nor `LimeInstance` may ever store plaintext passwords (`password` key is rejected by `keys().hasOnly(...)`).
4. `uid`, `ownerUid`, `id`, and `createdAt` are immutable once created (`incoming().field == existing().field`).
5. `createdAt` and `updatedAt` MUST match `request.time`.
6. Document IDs `{userId}` and `{instanceId}` MUST satisfy `isValidId` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read/write**: `auth = null` reading `/users/u1/instances/i1` -> `PERMISSION_DENIED`.
2. **Unverified email**: `auth.token.email_verified = false` creating `/users/u1` -> `PERMISSION_DENIED`.
3. **Cross-tenant read**: `auth.uid = "u2"` reading `/users/u1` or `/users/u1/instances/i1` -> `PERMISSION_DENIED`.
4. **Cross-tenant list**: `auth.uid = "u2"` listing `/users/u1/instances` -> `PERMISSION_DENIED`.
5. **Identity spoofing**: `auth.uid = "u2"` creating `/users/u2/instances/i1` with `ownerUid: "u1"` -> `PERMISSION_DENIED`.
6. **Shadow / ghost field (`password` or `isAdmin`)**: `auth.uid = "u1"` writing `/users/u1/instances/i1` with extra `password: "secret"` -> `PERMISSION_DENIED`.
7. **Orphaned subcollection write**: creating `/users/u1/instances/i1` before `/users/u1` exists -> `PERMISSION_DENIED`.
8. **ID poisoning**: creating `/users/u1/instances/` with a 500-char or slash-containing ID -> `PERMISSION_DENIED`.
9. **Immutable field tampering**: updating `ownerUid` or `createdAt` on `/users/u1/instances/i1` -> `PERMISSION_DENIED`.
10. **Client-forged timestamp**: creating `/users/u1/instances/i1` with `createdAt` != `request.time` -> `PERMISSION_DENIED`.
11. **Invalid enum**: creating `/users/u1/instances/i1` with `connectionMode: "ssh"` or `limeVersion: "v99"` -> `PERMISSION_DENIED`.
12. **Oversized string / Denial of Wallet**: creating `/users/u1/instances/i1` with `name` > 120 chars or `rpcEndpoint` > 500 chars -> `PERMISSION_DENIED`.
