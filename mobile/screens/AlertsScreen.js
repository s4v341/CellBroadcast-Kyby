import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AlertContext } from '../context/AlertContext';

const AlertsScreen = () => {
  const { alerts, isConnected, unreadCount, markAllAsRead, clearAllAlerts } = useContext(AlertContext);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#ff6b6b';
      case 'high':
        return '#ffa940';
      case 'normal':
        return '#667eea';
      case 'low':
        return '#52c41a';
      default:
        return '#667eea';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return 'alert-circle';
      case 'high':
        return 'alert';
      case 'normal':
        return 'information';
      case 'low':
        return 'check-circle';
      default:
        return 'bell';
    }
  };

  const renderAlertItem = ({ item }) => (
    <View style={[styles.alertCard, { borderLeftColor: getSeverityColor(item.severity) }]}>
      <View style={styles.alertHeader}>
        <View style={styles.alertHeaderLeft}>
          <Icon
            name={getSeverityIcon(item.severity)}
            size={24}
            color={getSeverityColor(item.severity)}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.alertTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.severity) }
          ]}
        >
          <Text style={styles.severityText}>
            {item.severity?.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.alertMessage}>{item.message}</Text>
      <View style={styles.alertMeta}>
        {item.category && (
          <Text style={styles.metaText}>📁 {item.category}</Text>
        )}
        {item.location && (
          <Text style={styles.metaText}>📍 {item.location}</Text>
        )}
      </View>
      <Text style={styles.alertTime}>
        {new Date(item.created_at).toLocaleString('pt-BR')}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Nenhum alerta no momento</Text>
      <Text style={styles.emptySubText}>
        {isConnected
          ? 'Você receberá alertas em tempo real'
          : 'Conectando ao servidor...'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <View
        style={[
          styles.connectionStatus,
          { backgroundColor: isConnected ? '#52c41a' : '#ff6b6b' }
        ]}
      >
        <Icon
          name={isConnected ? 'wifi' : 'wifi-off'}
          size={16}
          color="#fff"
        />
        <Text style={styles.connectionText}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>

      {alerts.length > 0 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={markAllAsRead}
          >
            <Icon name="check-all" size={18} color="#667eea" />
            <Text style={styles.actionText}>Marcar como lido</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                'Limpar alertas',
                'Tem certeza que deseja limpar todos os alertas?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Limpar', onPress: clearAllAlerts, style: 'destructive' }
                ]
              )
            }
          >
            <Icon name="trash-can" size={18} color="#ff6b6b" />
            <Text style={[styles.actionText, { color: '#ff6b6b' }]}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={alerts.length === 0 ? { flex: 1 } : {}}
        scrollIndicatorInsets={{ right: 1 }}
      />

      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unreadCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  connectionStatus: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  connectionText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600'
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600'
  },
  alertCard: {
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700'
  },
  alertMessage: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8
  },
  alertMeta: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    marginRight: 12,
    marginBottom: 4
  },
  alertTime: {
    fontSize: 11,
    color: '#aaa',
    fontStyle: 'italic'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center'
  },
  unreadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  }
});

export default AlertsScreen;
