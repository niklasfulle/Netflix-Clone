import { db } from "@/lib/db";

import { createOperationalLeaseCoordinator } from "./lease";
import { createPostgresOperationalLeaseStore } from "./postgres-lease-store";

export const operationalLeases = createOperationalLeaseCoordinator({
  store: createPostgresOperationalLeaseStore(db),
});
