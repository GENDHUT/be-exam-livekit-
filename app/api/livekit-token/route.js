import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    // Cek konfigurasi environment
    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit configuration missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { names = [], count = 0, room } = body;

    // Room wajib
    if (!room || typeof room !== "string" || room.trim() === "") {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    let participants = [];

    // Process names jika ada
    if (names && Array.isArray(names) && names.length > 0) {
      participants = names
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n !== "");
    }

    // SELALU proses count, bahkan jika names ada
    // Count default 0, jadi jika count > 0 kita tambahkan
    if (count > 0) {
      const additionalParticipants = Array.from({ length: count }, () =>
        `user-${Math.random().toString(36).substring(2, 10)}`
      );
      participants = [...participants, ...additionalParticipants];
    }

    // Jika tetap kosong => error
    if (participants.length === 0) {
      return NextResponse.json(
        { error: "Please provide participant names OR a valid 'count' number" },
        { status: 400 }
      );
    }

    const tokens = [];

    // Generate token tiap peserta
    for (const participantName of participants) {
      const token = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
        ttl: 3600, // expires dalam 1 jam (detik)
      });

      token.addGrant({
        roomJoin: true,
        room: room,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();

      tokens.push({
        name: participantName,
        token: jwt,
        room: room,
        roomUrl: livekitUrl,
      });
    }

    return NextResponse.json({ room, tokens });
  } catch (error) {
    console.error("Error generating tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}