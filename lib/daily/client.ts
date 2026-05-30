export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    nbf?: number;
    exp?: number;
  };
}

export async function createDailyRoom(scheduledAtTime: string): Promise<DailyRoom> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error('DAILY_API_KEY is not configured in server environment.');
  }

  // Set room activation time (Not Before) to 15 mins before, and expiration to 2.5 hours after
  const scheduledTimeUnix = Math.floor(new Date(scheduledAtTime).getTime() / 1000);
  const nbf = scheduledTimeUnix - 900; // 15 mins prior
  const exp = scheduledTimeUnix + 9000; // 2.5 hours duration

  console.log(`📡 Requesting Daily.co room with nbf=${nbf} and exp=${exp}...`);

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      properties: {
        nbf,
        exp,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Daily.co API failed: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    created_at: data.created_at,
    config: {
      nbf: data.properties?.nbf,
      exp: data.properties?.exp,
    },
  };
}
