// File: nesora-app/src/lib/mux.ts
// Mux HLS URLs. Shorts and trailers are public; long videos need the signed
// token the playback API returns.
export function publicStream(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function signedStream(playbackId: string, token: string) {
  return `https://stream.mux.com/${playbackId}.m3u8?token=${encodeURIComponent(token)}`;
}