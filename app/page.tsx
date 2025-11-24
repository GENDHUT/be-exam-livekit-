'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import styles from '@/styles/Home.module.css';

export default function Page() {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <h2>
            Custom Zoom {' '}
            .
          </h2>
        </div>

        <CustomMeetingForm />
      </main>

      <footer data-lk-theme="default">
        Powered by{' '}
        <a href="https://livekit.io" rel="noopener">
          LiveKit Cloud
        </a>
        .
      </footer>
    </>
  );
}

function CustomMeetingForm() {
  const router = useRouter();

  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!room.trim() || !name.trim()) {
      alert('Room name and Your name are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: room.trim(),
          names: [name.trim()],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const info = data.tokens[0];
      const token = info.token;
      const serverUrl = info.roomUrl;

      router.push(`/custom/?liveKitUrl=${encodeURIComponent(serverUrl)}&token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.error(err);
      alert('Failed to connect to server.');
      setLoading(false);
    }
  };

  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <h3 style={{ marginTop: 0 }}>Join a Meeting</h3>

      <input
        type="text"
        placeholder="Room Name"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        required
        style={{ width: '100%' }}
      />

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ width: '100%' }}
      />

      {/* Hidden token & URL fields – auto-filled, not user editable */}
      <input type="hidden" name="serverUrl" />
      <input type="hidden" name="token" />

      <button className="lk-button" type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
        {loading ? 'Connecting...' : 'Join Meeting'}
      </button>
    </form>
  );
}
