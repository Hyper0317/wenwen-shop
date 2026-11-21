# P1-07 Web RPC Acceptance Evidence

- Result: `PASSED`
- Android source revision: `eabd330513aa84937570fb74395870e980190c55`
- Web source revision: `3dd047e3ab106548d48d83489b610be55ded195c`
- Isolated project: `almeuirpfxteiktwbyls`
- Checks: 39 passed, 0 failed

## Covered

- The page's exact PostgREST RPC payloads were exercised for single sale, cart batch sale and refund.
- Fixed sale, batch and refund IDs were replayed and did not repeat inventory, counter or sales writes.
- Different payloads reusing the same fixed IDs were rejected with HTTP 409.
- credit_info and refund_info remained JSONB objects and stayed readable through legacy web paths.
- Single-row PATCH requires exactly one represented object; zero rows are observable as 200 [] for client rejection.
- The LEGACY_WRITE table write path remained callable for immediate rollback.
- Browser runtime tests loaded the real page through local HTTP, verified the shared script and exercised mode persistence.

No production database, production business data or formal APK was used. The evidence contains no key, Authorization header, request body, raw SQL, password or connection string.
