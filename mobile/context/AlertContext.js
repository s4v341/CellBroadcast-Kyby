import React, { createContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import PushNotification from 'react-native-push-notification';

export const AlertContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

PushNotification.configure({
  onNotification: function (notification) {
    console.log('Notificação recebida:', notification);
  },
  permissions: {
    alert: true,
    badge: true,
    sound: true
  },
  popInitialNotification: true,
  requestPermissions: true
});

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 99999
    });

    newSocket.on('connect', () => {
      console.log('Conectado ao servidor de alertas');
      setIsConnected(true);
      newSocket.emit('alert:subscribe', {});
    });

    newSocket.on('alert:new', (data) => {
      console.log('Novo alerta recebido:', data);
      setAlerts(prevAlerts => [data, ...prevAlerts]);
      setUnreadCount(prev => prev + 1);

      PushNotification.localNotification({
        channelId: 'default',
        title: data.title,
        message: data.message,
        playSound: true,
        soundName: 'default',
        bigText: data.message,
        priority: data.severity === 'critical' ? 'high' : 'default'
      });
    });

    newSocket.on('alert:deleted', (data) => {
      console.log('Alerta deletado:', data.id);
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== data.id));
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const value = {
    alerts,
    socket,
    isConnected,
    unreadCount,
    markAllAsRead,
    clearAllAlerts,
    setAlerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}
