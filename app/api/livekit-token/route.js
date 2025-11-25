import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { NextResponse } from 'next/server';

// === Helper untuk ambil daftar pengawas di room ===
async function getActiveSupervisors(roomService, roomName) {
  try {
    const participants = await roomService.listParticipants(roomName);
    return participants
      .map(p => p.identity)
      .filter(id => id.startsWith("pengawas-"));
  } catch {
    return [];
  }
}

export async function POST(request) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit configuration missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { names = [], count = 0, room, role = "user" } = body;

    if (!room || typeof room !== "string" || room.trim() === "") {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    // ============================================================
    //  🔥  BAGIAN BARU: HANDLE PENGAWAS (supervisor role)
    // ============================================================
    if (role === "pengawas") {
      const supervisors = await getActiveSupervisors(roomService, room);

      if (supervisors.length >= 10) {
        return NextResponse.json(
          { error: "Max 10 pengawas di room ini" },
          { status: 400 }
        );
      }

      const nextNumber = supervisors.length + 1;
      const identity = `pengawas-${nextNumber}`;

      const token = new AccessToken(apiKey, apiSecret, {
        identity,
        ttl: 3600,
      });

      token.addGrant({
        room,
        roomJoin: true,
        canPublish: false,
        canSubscribe: true,
        canPublishData: true,
      });

      return NextResponse.json({
        room,
        tokens: [
          {
            name: identity,
            token: await token.toJwt(),
            room: room,
            roomUrl: livekitUrl,
          }
        ]
      });
    }

    // ============================================================
    // 🔥 FITUR LAMA: user biasa (names & count)
    // ============================================================

    let participants = [];

    if (names && Array.isArray(names) && names.length > 0) {
      participants = names
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n !== "");
    }

    if (count > 0) {
      const additional = Array.from({ length: count }, () =>
        `user-${Math.random().toString(36).substring(2, 10)}`
      );
      participants = [...participants, ...additional];
    }

    if (participants.length === 0) {
      return NextResponse.json(
        { error: "Provide participant names OR a valid 'count'" },
        { status: 400 }
      );
    }

    const tokens = [];

    for (const name of participants) {
      const token = new AccessToken(apiKey, apiSecret, {
        identity: name,
        ttl: 3600,
      });

      token.addGrant({
        roomJoin: true,
        room: room,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      tokens.push({
        name,
        token: await token.toJwt(),
        room,
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


// ==================================================================
//  🔥  GET: LIST ROOMS ATAU LIST PARTICIPANTS DALAM ROOM
// ==================================================================
export async function GET(req) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit configuration missing" },
        { status: 500 }
      );
    }

    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get("room");

    // Jika query ?room=xxx → tampilkan participants
    if (roomName) {
      try {
        const participants = await roomService.listParticipants(roomName);
        return NextResponse.json({
          room: roomName,
          participants
        });
      } catch {
        return NextResponse.json(
          { error: `Room "${roomName}" not found or empty` },
          { status: 404 }
        );
      }
    }

    // Jika tanpa query → tampilkan semua room aktif
    const rooms = await roomService.listRooms();

    return NextResponse.json({
      activeRooms: rooms
    });

  } catch (error) {
    console.error("Error in GET method:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}


// ==================================================================
//  OPTIONS (untuk CORS preflight)
// ==================================================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
