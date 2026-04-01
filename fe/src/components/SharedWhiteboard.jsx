import React, { useEffect, useState, useRef } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export default function SharedWhiteboard({ roomId, socket }) {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = (data) => {
      if (!store) return;
      isUpdatingRef.current = true;
      try {
        store.mergeRemoteChanges(() => store.put(data));
      } catch (err) {
        console.error("TLDraw merge diff error", err);
      } finally {
        isUpdatingRef.current = false;
      }
    };

    socket.on('whiteboard_update', handleUpdate);
    return () => {
      socket.off('whiteboard_update', handleUpdate);
    }
  }, [socket, store]);

  useEffect(() => {
    if (!store || !socket) return;
    const unsub = store.listen((update) => {
      if (isUpdatingRef.current) return;
      const changes = { ...update.changes.added, ...update.changes.updated };
      const records = Object.values(changes);
      if (records.length > 0) {
        socket.emit('whiteboard_update', { roomId, elements: records });
      }
    }, { source: 'user', scope: 'document' });
    return () => unsub();
  }, [store, roomId, socket]);

  const handleMount = (editor) => {
    editor.setCameraOptions({ wheelBehavior: 'pan' });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Tldraw store={store} theme="dark" onMount={handleMount} />
    </div>
  );
}
