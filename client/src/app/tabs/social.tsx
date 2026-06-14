import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';
import { friendApi, messageApi, userApi } from '@/services/api';
import { getProfileAvatar } from '@/services/mockData';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { useTheme } from '@/context/ThemeContext';
import { PlayerCard, ChatRow, ChatBubble, SearchBar } from '@/components';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: string;
  name: string;
  avatar: string;
  gamesInCommon: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  isOwn: boolean;
}

interface IncomingRequest {
  requestId: string;
  fromUserId: string;
}

// ─── Bloqueo para menores de 16 ──────────────────────────────────────────────
function Under16Block() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: rw(32) }]}>
      <View style={[styles.blockIconCircle, { backgroundColor: colors.purpleMuted }]}>
        <MaterialIcons name="lock-outline" size={rw(48)} color={colors.purple} />
      </View>
      <Text style={[styles.blockTitle, { color: colors.text }]}>
        Función no disponible
      </Text>
      <Text style={[styles.blockSubtitle, { color: colors.textMuted }]}>
        Las funciones sociales (amigos y mensajes) no están disponibles para usuarios menores de 16 años.
      </Text>
    </SafeAreaView>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function SocialScreen() {
  const { user } = useAuth();

  if (user?.isUnder16) return <Under16Block />;

  return <SocialContent />;
}

function SocialContent() {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [friends, setFriends]                   = useState<User[]>([]);
  const [friendIds, setFriendIds]               = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions]           = useState<User[]>([]);
  const [selectedUser, setSelectedUser]         = useState<User | null>(null);
  const [messages, setMessages]                 = useState<Message[]>([]);
  const [messageText, setMessageText]           = useState('');
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState<User[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [pendingRequests, setPendingRequests]   = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [showSearchModal, setShowSearchModal]   = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [friendsRes, requestsRes] = await Promise.allSettled([
          friendApi.getFriends(),
          friendApi.getFriendRequests(),
        ]);

        if (friendsRes.status === 'fulfilled') {
          const arr = (friendsRes.value.data as any)?.friends || [];
          const serverFriends: User[] = arr.map((f: any) => ({
            id:            f.uid || f.id || f.userId,
            name:          f.username || f.name,
            avatar:        f.avatarId || f.avatar || getProfileAvatar(f.uid || f.id || f.userId),
            gamesInCommon: f.gamesInCommon || 0,
            isOnline:      f.isOnline || false,
          }));
          setFriends(serverFriends);
          setFriendIds(new Set(serverFriends.map((f) => f.id)));
        }

        if (requestsRes.status === 'fulfilled') {
          const arr = (requestsRes.value.data as any)?.requests || [];
          const incoming: IncomingRequest[] = arr
            .map((r: any) => ({ requestId: r.requestId, fromUserId: r.from?.uid || r.from?.id }))
            .filter((r: IncomingRequest) => r.fromUserId);
          setIncomingRequests(incoming);
        }

        setSuggestions([]);
      } catch {
        setFriends([]);
        setSuggestions([]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await userApi.searchUsers(q);
      const arr = (res.data as any)?.users || [];
      const filtered = arr.filter((u: any) => (u.uid || u.id) !== currentUser?.uid);
      setSearchResults(filtered.map((u: any) => ({
        id:            u.uid || u.id,
        name:          u.username || u.name,
        avatar:        u.avatarId || u.avatar || getProfileAvatar(u.uid || u.id),
        gamesInCommon: 0,
        isOnline:      false,
      })));
    } catch { setSearchResults([]); }
  };

  const handleSubmitSearch = () => {
    if (searchQuery.length >= 2) setShowSearchModal(true);
  };

  const openConversation = async (u: User) => {
    if (!friendIds.has(u.id)) {
      Alert.alert(
        'No son amigos aún',
        `Agregá a ${u.name} como amigo primero para poder chatear.`,
        [{ text: 'Entendido' }],
      );
      return;
    }
    setSelectedUser(u);
    setMessages([]);
    try {
      const res = await messageApi.getMessages(u.id);
      const serverMsgs: Message[] = ((res.data as any) || []).map((m: any) => ({
        id:        m.id,
        userId:    m.fromUserId,
        userName:  m.fromUsername || u.name,
        message:   m.content || m.message || m.text,
        timestamp: m.timestamp || m.sentAt || m.createdAt,
        isOwn:     m.isOwn || false,
      }));
      if (serverMsgs.length > 0) setMessages(serverMsgs);
    } catch {}
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser) return;
    const optimistic: Message = {
      id:        Date.now().toString(),
      userId:    'own',
      userName:  'Yo',
      message:   messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn:     true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageText('');
    try { await messageApi.sendMessage(selectedUser.id, optimistic.message); } catch {}
  };

  const handleAddFriend = async (userId: string) => {
    if (pendingRequests.includes(userId)) return;
    try {
      await friendApi.sendFriendRequest(userId);
      setPendingRequests((prev) => [...prev, userId]);
    } catch {}
  };

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    try {
      await friendApi.respondToRequest(requestId, true);
      const accepted = searchResults.find((u) => u.id === fromUserId);
      if (accepted) {
        setFriends((prev) => [...prev, accepted]);
        setFriendIds((prev) => new Set([...prev, fromUserId]));
      }
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch {}
  };

  const getUserAction = (
    userId: string,
    onChat?: () => void,
  ): { label: string; onAction?: () => void; actionDisabled?: boolean } => {
    if (friendIds.has(userId)) return { label: 'Mensaje', onAction: onChat };
    const inc = incomingRequests.find((r) => r.fromUserId === userId);
    if (inc) return { label: 'Aceptar', onAction: () => handleAcceptRequest(inc.requestId, userId) };
    if (pendingRequests.includes(userId)) return { label: 'Solicitud enviada', onAction: () => {}, actionDisabled: true };
    return { label: '+ Agregar', onAction: () => handleAddFriend(userId) };
  };

  // ── Modal de resultados de búsqueda ───────────────────────────────────────
  const searchModal = (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
              Resultados para "{searchQuery}"
            </Text>
            <TouchableOpacity
              onPress={() => setShowSearchModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="close" size={rw(24)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: rs.md, gap: rh(10) }}>
            {searchResults.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="search-off" size={rw(40)} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sin resultados para "{searchQuery}"</Text>
              </View>
            ) : (
              searchResults.map((u) => {
                const { label, onAction, actionDisabled } = getUserAction(
                  u.id,
                  () => { setShowSearchModal(false); openConversation(u); },
                );
                return (
                  <PlayerCard
                    key={u.id}
                    {...u}
                    actionLabel={label}
                    onAction={onAction}
                    actionDisabled={actionDisabled}
                  />
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ── Vista de chat ──────────────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {searchModal}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
            </TouchableOpacity>
            <View style={styles.chatUserInfo}>
              <Text style={[styles.chatName, { color: colors.text }]}>{selectedUser.name}</Text>
              <Text style={[styles.chatStatus, { color: selectedUser.isOnline ? '#22C55E' : colors.textMuted }]}>
                {selectedUser.isOnline ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            style={[styles.messagesArea, { backgroundColor: colors.background }]}
            contentContainerStyle={{ padding: rs.md, gap: rh(10) }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: 'center', marginTop: rh(40) }]}>
                Comenzá la conversación con {selectedUser.name}
              </Text>
            )}
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.message}
                timestamp={msg.timestamp}
                isOwn={msg.isOwn}
              />
            ))}
          </ScrollView>

          <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.msgInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Escribí un mensaje..."
              placeholderTextColor={colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: messageText.trim() ? colors.purple : colors.textMuted }]}
              onPress={handleSend}
              disabled={!messageText.trim()}
            >
              <MaterialIcons name="send" size={rw(18)} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Vista social principal ─────────────────────────────────────────────────
  const displayList = searchQuery.length >= 2 ? searchResults : friends;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {searchModal}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.screenHeader, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Social</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            onSearch={handleSubmitSearch}
            placeholder="Buscar usuarios..."
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.purple} />
          </View>
        ) : (
          <>
            {suggestions.length > 0 && searchQuery.length < 2 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Sugerencias</Text>
                {suggestions.map((u) => {
                  const { label, onAction, actionDisabled } = getUserAction(u.id, () => openConversation(u));
                  return (
                    <PlayerCard
                      key={u.id}
                      {...u}
                      actionLabel={label}
                      onAction={onAction}
                      actionDisabled={actionDisabled}
                      onPress={friendIds.has(u.id) ? () => openConversation(u) : undefined}
                    />
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {searchQuery.length >= 2
                  ? 'Resultados'
                  : `Amigos${friends.length > 0 ? ` (${friends.length})` : ''}`}
              </Text>

              {displayList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons
                    name={searchQuery.length >= 2 ? 'search-off' : 'people-outline'}
                    size={rw(36)}
                    color={colors.textMuted}
                  />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {searchQuery.length >= 2
                      ? 'Presioná la lupa para ver todos los resultados'
                      : 'Buscá usuarios para agregarlos como amigos'}
                  </Text>
                </View>
              ) : (
                displayList.map((u) => {
                  if (searchQuery.length >= 2) {
                    const { label, onAction, actionDisabled } = getUserAction(u.id, () => openConversation(u));
                    return (
                      <PlayerCard
                        key={u.id}
                        {...u}
                        actionLabel={label}
                        onAction={onAction}
                        actionDisabled={actionDisabled}
                      />
                    );
                  }
                  return (
                    <ChatRow
                      key={u.id}
                      name={u.name}
                      avatar={u.avatar}
                      isOnline={u.isOnline}
                      onPress={() => openConversation(u)}
                    />
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  // Under16
  blockIconCircle: { width: rw(90), height: rw(90), borderRadius: rw(45), alignItems: 'center', justifyContent: 'center', marginBottom: rh(16) },
  blockTitle:      { fontSize: rf(20), fontWeight: '700', textAlign: 'center', marginBottom: rh(8) },
  blockSubtitle:   { fontSize: rf(14), textAlign: 'center', lineHeight: rh(22) },
  // Social
  screenHeader:    { padding: rs.md, paddingBottom: rh(20), gap: rh(14) },
  screenTitle:     { fontSize: rf(24), fontWeight: '700' },
  loading:         { height: rh(180), alignItems: 'center', justifyContent: 'center' },
  section:         { paddingHorizontal: rs.md, marginBottom: rh(20), gap: rh(10) },
  sectionTitle:    { fontSize: rf(16), fontWeight: '600' },
  emptyBox:        { alignItems: 'center', paddingVertical: rh(28), gap: rh(10) },
  emptyText:       { fontSize: rf(14), textAlign: 'center' },
  // Chat
  chatHeader:      { flexDirection: 'row', alignItems: 'center', padding: rs.md, borderBottomWidth: 1, gap: rw(12) },
  backBtn:         {},
  chatUserInfo:    { flex: 1 },
  chatName:        { fontSize: rf(16), fontWeight: '600' },
  chatStatus:      { fontSize: rf(12) },
  messagesArea:    { flex: 1 },
  inputBar:        { flexDirection: 'row', alignItems: 'flex-end', padding: rs.md, borderTopWidth: 1, gap: rw(10) },
  msgInput:        {
    flex: 1,
    borderRadius: rw(20), borderWidth: 1, paddingHorizontal: rs.md,
    paddingVertical: rh(10), fontSize: rf(15), maxHeight: rh(100),
  },
  sendBtn:         { width: rw(42), height: rw(42), borderRadius: rw(21), alignItems: 'center', justifyContent: 'center' },
  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent:    { borderTopLeftRadius: rw(24), borderTopRightRadius: rw(24), maxHeight: '82%', paddingBottom: rh(24) },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: rs.md, borderBottomWidth: 1 },
  modalTitle:      { fontSize: rf(16), fontWeight: '700', flex: 1, marginRight: rw(10) },
});
