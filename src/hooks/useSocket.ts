import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

interface UseSocketOptions {
    /** JWT token for authenticated rooms (specialist / admin) */
    authToken?: string | null;
    /** Rooms to auto-join on connect, e.g. ['join_explore'] */
    autoJoin?: { event: string; payload?: any }[];
    /** If false the hook will not connect at all */
    enabled?: boolean;
}

/**
 * Centralised Socket.IO hook.
 * Returns the live socket instance + connection status.
 */
export function useSocket(options: UseSocketOptions = {}) {
    const { authToken, autoJoin = [], enabled = true } = options;
    const [connected, setConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // Stable serialised key for autoJoin
    const autoJoinKey = JSON.stringify(autoJoin);

    useEffect(() => {
        if (!enabled) return;

        console.log('[useSocket] Connecting to', SOCKET_URL);

        const s = io(SOCKET_URL, {
            ...(authToken ? { auth: { token: `Bearer ${authToken}` } } : {}),
            transports: ['websocket'],   // Skip polling — go straight to WS
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = s;
        setSocket(s);

        s.on('connect', () => {
            console.log('[useSocket] Connected, id:', s.id);
            setConnected(true);
            // Auto-join requested rooms
            const parsed = JSON.parse(autoJoinKey) as { event: string; payload?: any }[];
            parsed.forEach(({ event, payload }) => {
                console.log('[useSocket] Emitting', event, payload ?? '');
                if (payload !== undefined) {
                    s.emit(event, payload);
                } else {
                    s.emit(event);
                }
            });
        });

        s.on('disconnect', (reason) => {
            console.log('[useSocket] Disconnected:', reason);
            setConnected(false);
        });

        s.on('connect_error', (err) => {
            console.error('[useSocket] Connection error:', err.message);
        });

        return () => {
            console.log('[useSocket] Cleaning up');
            s.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken, enabled, autoJoinKey]);

    return { socket, connected };
}
