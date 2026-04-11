import React, { createContext, useContext, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { TText, useTheme } from './ThemedUI';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showToast: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { colors } = useTheme();

  const showToast = useCallback((message: string, type: NotificationType = 'success') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} color="#fff" />;
      case 'error': return <AlertCircle size={18} color="#fff" />;
      default: return <Info size={18} color="#fff" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return COLORS.success || '#10B981';
      case 'error': return COLORS.danger || '#EF4444';
      default: return COLORS.primary;
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        <AnimatePresence>
          {notifications.map((n) => (
            <MotiView
              key={n.id}
              from={{ opacity: 0, translateY: 20, scale: 0.9 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={[styles.toast, { backgroundColor: getBgColor(n.type), ...SHADOWS.md }]}
            >
              {getIcon(n.type)}
              <TText style={styles.text}>{n.message}</TText>
            </MotiView>
          ))}
        </AnimatePresence>
      </View>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    maxWidth: '90%',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 10,
    fontSize: 14,
  },
});
