'use client';

import { formatChatMessageLinks, RoomContext, VideoConference } from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoPresets,
  type VideoCodec,
} from 'livekit-client';
import { DebugMode } from '@/lib/Debug';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';
import { useRouter } from 'next/navigation';

export function VideoConferenceClientImpl(props: {
  liveKitUrl: string;
  token: string;
  codec: VideoCodec | undefined;
  singlePeerConnection: boolean | undefined;
}) {
  const router = useRouter();

  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = useState(false);

  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: props.codec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
      singlePeerConnection: props.singlePeerConnection,
    };
  }, [e2eeEnabled, props.codec, keyProvider, worker]);

  const room = useMemo(() => new Room(roomOptions), [roomOptions]);

  const connectOptions = useMemo((): RoomConnectOptions => {
    return { autoSubscribe: true };
  }, []);

  // E2EE setup
  useEffect(() => {
    let cancelled = false;

    if (e2eeEnabled) {
      keyProvider.setKey(e2eePassphrase).then(() => {
        if (cancelled) return;
        room.setE2EEEnabled(true).then(() => {
          if (!cancelled) setE2eeSetupComplete(true);
        });
      });
    } else {
      setE2eeSetupComplete(true);
    }

    return () => {
      cancelled = true;
    };
  }, [e2eeEnabled, e2eePassphrase, keyProvider, room]);

  // Connect to the room
  useEffect(() => {
    if (!e2eeSetupComplete) return;

    room
      .connect(props.liveKitUrl, props.token, connectOptions)
      .catch((err) => console.error(err));

    room.localParticipant.enableCameraAndMicrophone().catch((err) => console.error(err));

    return () => {
      // cleanup doesn't return Room anymore (fix TypeScript)
      if (room && room.state !== 'disconnected') {
        room.disconnect();
      }
    };
  }, [room, props.liveKitUrl, props.token, connectOptions, e2eeSetupComplete]);

  // ⭐ Redirect after leave
  useEffect(() => {
    const handleDisconnect = () => {
      router.push('/');
    };

    room.on('disconnected', handleDisconnect);

    return () => {
      room.off('disconnected', handleDisconnect);
    };
  }, [room, router]);

  useLowCPUOptimizer(room);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={
            process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true'
              ? SettingsMenu
              : undefined
          }
        />
        <DebugMode logLevel={LogLevel.debug} />
      </RoomContext.Provider>
    </div>
  );
}
