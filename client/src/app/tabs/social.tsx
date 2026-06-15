import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { friendApi, messageApi, userApi } from '@/services/api';
import { getProfileAvatar } from '@/services/mockData';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { useTranslation } from 'react-i18next';
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
  message: string;
  timestamp: string;
  isOwn: boolean;
}

interface IncomingRequest {
  requestId: string;
  fromUserId: string;
  username: string;
  avatarId: string;
}

// ─── Bloqueo para menores de 16 ──────────────────────────────────────────────
function Under16Block() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: rw(32) }]}>
      <View style={[styles.blockIconCircle, { backgroundColor: colors.purpleMuted }]}>
        <MaterialIcons name="lock-outline" size={rw(48)} color={colors.purple} />
      </View>
      <Text style={[styles.blockTitle, { color: colors.text }]}>
        {t('social.under16.title')}
      </Text>
      <Text style={[styles.blockSubtitle, { color: colors.textMuted }]}>
        {t('social.under16.message')}
      </Text>
    </SafeAreaView>
  );
}

// ─── Fila de solicitud con Aceptar / Rechazar ─────────────────────────────────
function RequestRow({
  request, onAccept, onDecline, onPress,
}: {
  request: IncomingRequest;
  onAccept: () => void;
  onDecline: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.requestRow, { backgroundColor: colors.card, borderColor: colors.purpleBorder }]}>
      <PlayerCard
        id={request.fromUserId}
        name={request.username || request.fromUserId}
        avatar={request.avatarId}
        onPress={onPress}
      />
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.purple }]}
          onPress={onAccept}
        >
          <MaterialIcons name="check" size={rw(16)} color="#fff" />
          <Text style={styles.acceptBtnText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: colors.border }]}
          onPress={onDecline}
        >
          <MaterialIcons name="close" size={rw(16)} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Pantalla principal ──────────────────────────────────────────────────────
export default function SocialScreen() {
  const { user } = useAuth();
  if (user?.isUnder16) return <Under16Block />;
  return <SocialContent />;
}

function SocialContent() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const router = useRouter();

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
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [friendsRes, requestsRes, recsRes] = await Promise.allSettled([
          friendApi.getFriends(),
          friendApi.getFriendRequests(),
          currentUser?.id ? userApi.getRecommendations(currentUser.id) : Promise.reject(),
        ]);

        if (friendsRes.status === 'fulfilled') {
          const arr = (friendsRes.value.data as any)?.friends || [];
          const serverFriends: User[] = arr.map((f: any) => ({
            id:            f.uid || f.id || f.userId,
            name:          f.username || f.name,
            avatar:        f.avatarId || f.avatar || getProfileAvatar(f.uid || f.id || ''),
            gamesInCommon: f.gamesInCommon || 0,
            isOnline:      f.isOnline || false,
          }));
          setFriends(serverFriends);
          setFriendIds(new Set(serverFriends.map((f) => f.id)));
        }

        if (requestsRes.status === 'fulfilled') {
          const arr = (requestsRes.value.data as any)?.requests || [];
          setIncomingRequests(
            arr
              .map((r: any) => ({
                requestId:  r.requestId,
                fromUserId: r.from?.uid || r.from?.id || '',
                username:   r.from?.username || '',
                avatarId:   r.from?.avatarId || '',
              }))
              .filter((r: IncomingRequest) => r.fromUserId),
          );
        }

        if (recsRes.status === 'fulfilled') {
          const arr = (recsRes.value.data as any)?.recommendations || recsRes.value.data || [];
          setSuggestions(
            (Array.isArray(arr) ? arr : []).map((r: any) => ({
              id:            r.uid,
              name:          r.username,
              avatar:        r.avatarId || getProfileAvatar(r.uid),
              gamesInCommon: r.commonGamesCount || 0,
              isOnline:      false,
            })),
          );
        }
      } catch {
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.id]);

  // ── Polling en tiempo real cuando hay chat abierto ─────────────────────────
  useEffect(() => {
    if (!selectedUser) return;
    const poll = setInterval(async () => {
      try {
        const res = await messageApi.getMessages(selectedUser.id);
        const data: any[] = (res.data as any) || [];
        if (!Array.isArray(data) || data.length === 0) return;
        setMessages(data.map((m: any) => ({
          id:        m.id || m.messageId,
          userId:    m.fromUserId,
          message:   m.content || m.text || m.message || '',
          timestamp: m.sentAt || m.timestamp || m.createdAt || '',
          isOwn:     m.fromUserId === currentUser?.id || m.isOwn || false,
        })));
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [selectedUser?.id, currentUser?.id]);

  // ── Búsqueda con debounce (400ms) ────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await userApi.searchUsers(q);
        const arr = (res.data as any)?.users || [];
        const filtered = arr.filter((u: any) => (u.uid || u.id) !== currentUser?.id);
        setSearchResults(filtered.map((u: any) => ({
          id:            u.uid || u.id,
          name:          u.username || u.name,
          avatar:        u.avatarId || u.avatar || getProfileAvatar(u.uid || u.id),
          gamesInCommon: 0,
          isOnline:      false,
        })));
      } catch { setSearchResults([]); }
    }, 400);
  };

  // ── Chat ───────────────────────────────────────────────────────────────────
  const openConversation = async (u: User) => {
    if (!friendIds.has(u.id)) {
      Alert.alert(
        t('social.notFriendsTitle'),
        t('social.notFriendsMsg', { name: u.name }),
        [{ text: t('social.understood') }],
      );
      return;
    }
    setSelectedUser(u);
    setMessages([]);
    try {
      const res = await messageApi.getMessages(u.id);
      const data: any[] = (res.data as any) || [];
      if (Array.isArray(data)) {
        setMessages(data.map((m: any) => ({
          id:        m.id || m.messageId,
          userId:    m.fromUserId,
          message:   m.content || m.text || m.message || '',
          timestamp: m.sentAt || m.timestamp || m.createdAt || '',
          isOwn:     m.fromUserId === currentUser?.id || m.isOwn || false,
        })));
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser) return;
    const text = messageText.trim();
    const optimistic: Message = {
      id:        `tmp_${Date.now()}`,
      userId:    currentUser?.id || 'own',
      message:   text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn:     true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageText('');
    try { await messageApi.sendMessage(selectedUser.id, text); } catch {}
  };

  // ── Amigos ─────────────────────────────────────────────────────────────────
  const handleAddFriend = async (userId: string) => {
    if (pendingRequests.includes(userId)) return;
    try {
      await friendApi.sendFriendRequest(userId);
      setPendingRequests((prev) => [...prev, userId]);
    } catch {}
  };

  const handleAcceptRequest = async (requestId: string, fromUserId: string, username: string, avatarId: string) => {
    try {
      await friendApi.respondToRequest(requestId, true);
      const newFriend: User = { id: fromUserId, name: username, avatar: avatarId, gamesInCommon: 0, isOnline: false };
      setFriends((prev) => [...prev, newFriend]);
      setFriendIds((prev) => new Set([...prev, fromUserId]));
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch {}
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await friendApi.respondToRequest(requestId, false);
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch {}
  };

  const getUserAction = (userId: string, onChat?: () => void) => {
    if (friendIds.has(userId)) return { label: t('social.actions.message'), onAction: onChat };
    const inc = incomingRequests.find((r) => r.fromUserId === userId);
    if (inc) return { label: t('social.actions.accept'), onAction: () => handleAcceptRequest(inc.requestId, userId, inc.username, inc.avatarId) };
    if (pendingRequests.includes(userId)) return { label: t('social.actions.pending'), onAction: () => {}, actionDisabled: true };
    return { label: t('social.actions.add'), onAction: () => handleAddFriend(userId) };
  };


  // ── Vista de chat ──────────────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatUserInfo} onPress={() => router.push(`/user/${selectedUser.id}`)}>
              <Text style={[styles.chatName, { color: colors.text }]}>{selectedUser.name}</Text>
              <Text style={[styles.chatStatus, { color: selectedUser.isOnline ? '#22C55E' : colors.textMuted }]}>
                {selectedUser.isOnline ? t('social.online') : t('social.offline')}
              </Text>
            </TouchableOpacity>
            <MaterialIcons name="chevron-right" size={rw(18)} color={colors.textMuted} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={[styles.messagesArea, { backgroundColor: colors.background }]}
            contentContainerStyle={{ padding: rs.md, gap: rh(10) }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: 'center', marginTop: rh(40) }]}>
                {t('social.startConversation', { name: selectedUser.name })}
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
              placeholder={t('social.writeMessage')}
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.screenHeader, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>{t('social.title')}</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder={t('social.search')}
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.purple} />
          </View>
        ) : (
          <>
            {/* ── Solicitudes recibidas ── */}
            {incomingRequests.length > 0 && searchQuery.length < 2 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Solicitudes recibidas ({incomingRequests.length})
                </Text>
                {incomingRequests.map((req) => (
                  <RequestRow
                    key={req.requestId}
                    request={req}
                    onAccept={() => handleAcceptRequest(req.requestId, req.fromUserId, req.username, req.avatarId)}
                    onDecline={() => handleDeclineRequest(req.requestId)}
                    onPress={() => router.push(`/user/${req.fromUserId}`)}
                  />
                ))}
              </View>
            )}

            {/* ── Recomendaciones ── */}
            {searchQuery.length < 2 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Recomendaciones</Text>
                  <MaterialIcons name="auto-awesome" size={rw(16)} color={colors.purple} />
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {suggestions.length > 0 && suggestions.some((u) => u.gamesInCommon > 0)
                    ? 'Jugadores con juegos favoritos en común'
                    : 'Jugadores de la comunidad'}
                </Text>
                {suggestions.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="people-outline" size={rw(32)} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      Todavía no hay recomendaciones
                    </Text>
                  </View>
                ) : (
                  suggestions.map((u) => {
                    const { label, onAction, actionDisabled } = getUserAction(u.id, () => openConversation(u));
                    return (
                      <PlayerCard
                        key={u.id}
                        {...u}
                        actionLabel={label}
                        onAction={onAction}
                        actionDisabled={actionDisabled}
                        onPress={() => router.push(`/user/${u.id}`)}
                      />
                    );
                  })
                )}
              </View>
            )}

            {/* ── Amigos / Resultados ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {searchQuery.length >= 2
                  ? t('social.results')
                  : `${t('social.friends')}${friends.length > 0 ? ` (${friends.length})` : ''}`}
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
                      ? t('social.searchPrompt')
                      : t('social.addFriendsHint')}
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
                        onPress={() => router.push(`/user/${u.id}`)}
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
  container:        { flex: 1 },
  blockIconCircle:  { width: rw(90), height: rw(90), borderRadius: rw(45), alignItems: 'center', justifyContent: 'center', marginBottom: rh(16) },
  blockTitle:       { fontSize: rf(20), fontWeight: '700', textAlign: 'center', marginBottom: rh(8) },
  blockSubtitle:    { fontSize: rf(14), textAlign: 'center', lineHeight: rh(22) },
  screenHeader:     { padding: rs.md, paddingBottom: rh(20), gap: rh(14) },
  screenTitle:      { fontSize: rf(24), fontWeight: '700' },
  loading:          { height: rh(180), alignItems: 'center', justifyContent: 'center' },
  section:          { paddingHorizontal: rs.md, marginBottom: rh(20), gap: rh(10) },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: rw(6) },
  sectionTitle:     { fontSize: rf(16), fontWeight: '600' },
  sectionSubtitle:  { fontSize: rf(12), marginTop: -rh(4) },
  emptyBox:         { alignItems: 'center', paddingVertical: rh(28), gap: rh(10) },
  emptyText:        { fontSize: rf(14), textAlign: 'center' },
  // Solicitudes
  requestRow:       { borderRadius: rw(14), borderWidth: 1, overflow: 'hidden' },
  requestActions:   { flexDirection: 'row', alignItems: 'center', gap: rw(8), paddingHorizontal: rw(12), paddingBottom: rh(10) },
  acceptBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rw(6), paddingVertical: rh(8), borderRadius: rw(10) },
  acceptBtnText:    { color: '#fff', fontSize: rf(13), fontWeight: '600' },
  declineBtn:       { width: rw(36), height: rw(36), alignItems: 'center', justifyContent: 'center', borderRadius: rw(18), borderWidth: 1 },
  // Chat
  chatHeader:       { flexDirection: 'row', alignItems: 'center', padding: rs.md, borderBottomWidth: 1, gap: rw(12) },
  backBtn:          {},
  chatUserInfo:     { flex: 1 },
  chatName:         { fontSize: rf(16), fontWeight: '600' },
  chatStatus:       { fontSize: rf(12) },
  messagesArea:     { flex: 1 },
  inputBar:         { flexDirection: 'row', alignItems: 'flex-end', padding: rs.md, borderTopWidth: 1, gap: rw(10) },
  msgInput:         {
    flex: 1,
    borderRadius: rw(20), borderWidth: 1, paddingHorizontal: rs.md,
    paddingVertical: rh(10), fontSize: rf(15), maxHeight: rh(100),
  },
  sendBtn:          { width: rw(42), height: rw(42), borderRadius: rw(21), alignItems: 'center', justifyContent: 'center' },
});
