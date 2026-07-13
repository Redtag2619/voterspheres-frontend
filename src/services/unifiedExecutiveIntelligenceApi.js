import { api } from "./api";

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
}

function unwrap(response) {
  return response?.data || response || {};
}

export async function fetchUnifiedExecutiveIntelligence(
  filters = {}
) {
  const response = await api.get(
    "/unified-executive-intelligence/overview",
    {
      params: cleanParams({
        workspace_id:
          filters.workspace_id,

        state:
          filters.state,

        office:
          filters.office,

        risk:
          filters.risk,
      }),
    }
  );

  return unwrap(response);
}

export async function refreshUnifiedExecutiveIntelligence(
  filters = {}
) {
  const response = await api.post(
    "/unified-executive-intelligence/refresh",
    cleanParams({
      workspace_id:
        filters.workspace_id,

      state:
        filters.state,

      office:
        filters.office,

      risk:
        filters.risk,
    })
  );

  return unwrap(response);
}

export async function createUnifiedExecutiveAction(
  payload = {}
) {
  const response = await api.post(
    "/unified-executive-intelligence/actions",
    payload
  );

  return unwrap(response);
}

