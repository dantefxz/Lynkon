// src/screens/SocialScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { friendService, userService } from '../services/services';
import { RecommendedPlayer } from '../components/RecommendedPlayer';
import { ChatPlayer } from '../components/ChatPlayer';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

export function SocialScreen({ navigation }) {
  const { user } = useAuth();

  const [friends, setFriends]           = useState([]);
  const [requests, setRequests]         = useState([]);
  const [recommended, setRecommended]   = useState([]);
  const [search, setSearch]             = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState(null);
  const [pendingAdds, setPendingAdds]   = useState(new Set());

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [friendsData, requestsData] = await Promise.allSettled([
        friendService.getFriends(user.uid),
        friendService.getRequests(user.uid),
      ]);

      setFriends(friendsData.status === 'fulfilled' ? friendsData.value || [] : []);
      setRequests(requestsData.status === 'fulfilled' ? requestsData.value || [] : []);

      // Recomendaciones solo para +16
      if (!user.isUnder16) {
        try {
          const recs = await userService.getRecommendations(user.uid);
          setRecommended(recs || []);
        } catch {
          setRecommended([]); // silencioso si falla
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar tus amigos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => { loadData(); }, [loadData]);

  // Búsqueda de usuarios con debounce
  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await userService.searchUsers(search.trim());
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAddFriend = async (targetId) => {
    try {
      setPendingAdds((prev) => new Set([...prev, targetId]));
      await friendService.sendRequest(user.uid, targetId);
      Alert.alert('Solicitud enviada ✓', 'El jugador recibirá tu solicitud');
    } catch (err) {
      setPendingAdds((prev) => { const s = new Set(prev); s.delete(targetId); return s; });
      if (err.message.includes('ya son amigos')) {
        Alert.alert('Aviso', 'Ya son amigos');
      } else if (err.message.includes('ya enviada')) {
        Alert.alert('Aviso', 'Ya le enviaste una solicitud');
      } else {
        Alert.alert('Error', err.message);
      }
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      await friendService.respondRequest(user.uid, requestId, action);
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      if (action === 'accept') {
        Alert.alert('¡Nuevo amigo! 🎮', 'Ya pueden enviarse mensajes');
        loadData(); // recargar lista de amigos
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemoveFriend = (friendId, friendName) => {
    Alert.alert(
      'Eliminar amigo',
      `¿Querés eliminar a ${friendName} de tu lista de amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendService.removeFriend(user.uid, friendId);
              setFriends((prev) => prev.filter((f) => f.uid !== friendId));
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const isSearching = search.trim().length >= 2;
  const displayFriends = isSearching
    ? searchResults.filter((u) => u.uid !== user.uid)
    : friends;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Cargando amigos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Algo salió mal"
        description={error}
        actionLabel="Reintentar"
        onAction={() => { setLoading(true); loadData(); }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.purple} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Social</Text>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar jugadores..."
        showCancel={isSearching}
        onCancel={() => setSearch('')}
      />

      {/* Solicitudes pendientes */}
      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Solicitudes pendientes · {requests.length}
          </Text>
          {requests.map((req) => (
            <View key={req.requestId} style={styles.requestCard}>
              <Text style={styles.requestName}>{req.from?.username || req.from?.name}</Text>
              <View style={styles.requestActions}>
                <View style={styles.rejectBtn}>
                  <Text
                    style={styles.rejectText}
                    onPress={() => handleRespondRequest(req.requestId, 'reject')}
                  >
                    Rechazar
                  </Text>
                </View>
                <View style={styles.acceptBtn}>
                  <Text
                    style={styles.acceptText}
                    onPress={() => handleRespondRequest(req.requestId, 'accept')}
                  >
                    Aceptar
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Resultados de búsqueda */}
      {isSearching && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados</Text>
          {searching ? (
            <ActivityIndicator color={colors.purple} />
          ) : displayFriends.length === 0 ? (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>
                No encontramos jugadores con "{search}"
              </Text>
            </View>
          ) : (
            displayFriends.map((u) => (
              <ChatPlayer
                key={u.uid}
                user={{ ...u, name: u.username || u.name, isOnline: false }}
                onPress={() => {}}
                rightContent={
                  !friends.find((f) => f.uid === u.uid) && (
                    <Text
                      style={styles.addText}
                      onPress={() => handleAddFriend(u.uid)}
                    >
                      {pendingAdds.has(u.uid) ? '✓ Enviada' : '+ Agregar'}
                    </Text>
                  )
                }
              />
            ))
          )}
        </View>
      )}

      {/* Recomendados */}
      {!isSearching && !user?.isUnder16 && recommended.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recomendados para vos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.recommendedRow}>
              {recommended.map((u) => (
                <RecommendedPlayer
                  key={u.uid}
                  user={{ ...u, id: u.uid, name: u.username || u.name }}
                  onAdd={handleAddFriend}
                  isAdded={pendingAdds.has(u.uid)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Lista de amigos */}
      {!isSearching && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Amigos · {friends.length}
          </Text>
          {friends.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Sin amigos todavía"
              description="Buscá jugadores con juegos en común y mandales una solicitud"
              actionLabel="Buscar jugadores"
              onAction={() => {}}
            />
          ) : (
            friends.map((f) => (
              <ChatPlayer
                key={f.uid}
                user={{ ...f, name: f.username || f.name }}
                onPress={() => navigation.navigate('Chat', { friend: { ...f, name: f.username || f.name } })}
                onLongPress={() => handleRemoveFriend(f.uid, f.username || f.name)}
              />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ms(12) },
  loadingText:    { color: colors.textMuted, fontSize: fs(14) },
  content:        { padding: ms(16), paddingBottom: 100, gap: ms(20) },
  title:          { color: colors.text, fontSize: fs(24), fontWeight: '800' },
  section:        { gap: ms(10) },
  sectionTitle:   { color: colors.text, fontSize: fs(16), fontWeight: '700' },
  recommendedRow: { flexDirection: 'row' },
  requestCard:    { backgroundColor: colors.card, borderRadius: ms(14), borderWidth: 1, borderColor: colors.border, padding: ms(14), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestName:    { color: colors.text, fontSize: fs(14), fontWeight: '600', flex: 1 },
  requestActions: { flexDirection: 'row', gap: ms(8) },
  rejectBtn:      { paddingHorizontal: wp(12), paddingVertical: 7, borderRadius: ms(8), borderWidth: 1, borderColor: colors.error },
  rejectText:     { color: colors.error, fontSize: fs(12), fontWeight: '600' },
  acceptBtn:      { paddingHorizontal: wp(12), paddingVertical: 7, borderRadius: ms(8), backgroundColor: colors.purple },
  acceptText:     { color: '#fff', fontSize: fs(12), fontWeight: '600' },
  addText:        { color: colors.purpleLight, fontSize: fs(13), fontWeight: '600' },
  emptySearch:    { backgroundColor: colors.card, borderRadius: ms(14), padding: ms(20), alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptySearchText:{ color: colors.textMuted, fontSize: fs(13), textAlign: 'center' },
});
