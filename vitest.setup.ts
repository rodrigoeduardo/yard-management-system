import { loadEnv } from "./scripts/lib/load-env";

// Pin the process timezone to the yard's timezone so tests that construct
// `Date`s from local wall-clock components (e.g. `new Date(y, m, d, h, min)`)
// produce the same results regardless of the host/CI runner's timezone.
process.env.TZ = "America/Sao_Paulo";

loadEnv();
