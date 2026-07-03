const key = (mediaId) => `nakama_eps_${mediaId}`;

function readSet(mediaId) {
  try {
    const raw = localStorage.getItem(key(mediaId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function writeSet(mediaId, set) {
  localStorage.setItem(key(mediaId), JSON.stringify([...set]));
}

export async function getWatchedEpisodes(_userId, mediaId) {
  return readSet(mediaId);
}

export async function markEpisode(_userId, mediaId, episodeNumber, watched) {
  const eps = readSet(mediaId);
  if (watched) eps.add(episodeNumber);
  else eps.delete(episodeNumber);
  writeSet(mediaId, eps);
}

export async function markAllEpisodes(_userId, mediaId, total) {
  const eps = new Set(Array.from({ length: total }, (_, i) => i + 1));
  writeSet(mediaId, eps);
}

export async function clearEpisodes(_userId, mediaId) {
  localStorage.removeItem(key(mediaId));
}
