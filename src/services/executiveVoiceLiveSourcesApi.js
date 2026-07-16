import { api } from "./api";

function unwrap(
  response
) {
  return (
    response?.data ||
    response ||
    {}
  );
}

export async function getExecutiveVoiceSourceHealth() {
  const response =
    await api.get(
      "/executive-voice-live-sources/health"
    );

  return unwrap(
    response
  );
}

export async function searchExecutiveVoiceLiveNews(
  payload = {}
) {
  const response =
    await api.post(
      "/executive-voice-live-sources/news",
      payload
    );

  return unwrap(
    response
  );
}

export async function getExecutiveVoiceOpenFec(
  payload = {}
) {
  const response =
    await api.post(
      "/executive-voice-live-sources/fec",
      payload
    );

  return unwrap(
    response
  );
}

export async function getExecutiveVoiceLegislation(
  payload = {}
) {
  const response =
    await api.post(
      "/executive-voice-live-sources/legislation",
      payload
    );

  return unwrap(
    response
  );
}

export async function getExecutiveVoiceWeatherRisk(
  payload = {}
) {
  const response =
    await api.post(
      "/executive-voice-live-sources/weather-risk",
      payload
    );

  return unwrap(
    response
  );
}

export async function getExecutiveVoicePolling(
  payload = {}
) {
  const response =
    await api.post(
      "/executive-voice-live-sources/polling",
      payload
    );

  return unwrap(
    response
  );
}

export async function getExecutiveVoiceElectionAdministration(
  payload = {}
) {
  const response =
    await api.post(
      "/executive-voice-live-sources/election-administration",
      payload
    );

  return unwrap(
    response
  );
}

export async function clearExecutiveVoiceLiveSourceCache() {
  const response =
    await api.post(
      "/executive-voice-live-sources/cache/clear"
    );

  return unwrap(
    response
  );
}

export const executiveVoiceLiveSourcesApi =
  Object.freeze({
    health:
      getExecutiveVoiceSourceHealth,

    news:
      searchExecutiveVoiceLiveNews,

    fec:
      getExecutiveVoiceOpenFec,

    legislation:
      getExecutiveVoiceLegislation,

    weatherRisk:
      getExecutiveVoiceWeatherRisk,

    polling:
      getExecutiveVoicePolling,

    electionAdministration:
      getExecutiveVoiceElectionAdministration,

    clearCache:
      clearExecutiveVoiceLiveSourceCache,
  });

export default executiveVoiceLiveSourcesApi;
