import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';
import { friendApi, messageApi, userApi } from '@/services/api';
import { getProfileAvatar } from '@/services/mockData';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { colors } from '@/theme/colors';
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

// ─── Bloqueo para menores de 16 ──────────────────────────────────────────────
function Under16Block() {
  return (
    <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: rw(32) }]}>
      <View style={[styles.blockIconCircle, { backgroundColor: colors.purpleMuted }]}>
        <MaterialIcons name="lock" size={rw(48)} color={colors.purple} />
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

  // Bloqueo inmediato si es menor de 16
  if (user?.isUnder16) return <Under16Block />;

  return <SocialContent />;
}

function SocialContent() {
  const [friends, setFriends]             = useState<User[]>([]);
  const [suggestions, setSuggestions]     = useState<User[]>([]);
  const [selectedUser, setSelectedUser]   = useState<User | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [messageText, setMessageText]     = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading]             = useState(true);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]); // IDs con solicitud enviada
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [friendsRes, requestsRes] = await Promise.allSettled([
          friendApi.getFriends(),
          friendApi.getFriendRequests(),
        ]);

        if (friendsRes.status === 'fulfilled') {
          const serverFriends: User[] = ((friendsRes.value.data as any) || []).map((f: any) => ({
            id:            f.id || f.userId,
            name:          f.username || f.name,
            avatar:        f.avatar || getProfileAvatar(f.id || f.userId),
            gamesInCommon: f.gamesInCommon || 0,
            isOnline:      f.isOnline || false,
          }));
          setFriends(serverFriends);
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
      setSearchResults(((res.data as any) || []).map((u: any) => ({
        id:            u.id,
        name:          u.username || u.name,
        avatar:        u.avatar || getProfileAvatar(u.id),
        gamesInCommon: 0,
        isOnline:      false,
      })));
    } catch { setSearchResults([]); }
  };

  const openConversation = async (user: User) => {
    setSelectedUser(user);
    setMessages([]);
    try {
      // Corregido: getMessages en vez de getConversation
      const res = await messageApi.getMessages(user.id);
      const serverMsgs: Message[] = ((res.data as any) || []).map((m: any) => ({
        id:        m.id,
        userId:    m.fromUserId,
        userName:  m.fromUsername || user.name,
        message:   m.content || m.message,
        timestamp: m.timestamp || m.createdAt,
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

  // ── Vista de chat ──────────────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header chat */}
          <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
            </TouchableOpacity>
            <View style={styles.chatUserInfo}>
              <Text style={styles.chatName}>{selectedUser.name}</Text>
              <Text style={[styles.chatStatus, { color: selectedUser.isOnline ? colors.online : colors.textMuted }]}>
                {selectedUser.isOnline ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>

          {/* Mensajes */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesArea}
            contentContainerStyle={{ padding: rs.md, gap: rh(10) }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <Text style={[styles.emptyText, { textAlign: 'center', marginTop: rh(40) }]}>
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

          {/* Input */}
          <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.msgInput, { borderColor: colors.border }]}
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
  const displayFriends = searchQuery.length >= 2 ? searchResults : friends;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.screenHeader, { backgroundColor: colors.cardAlt }]}>
          <Text style={styles.screenTitle}>Social</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Buscar usuarios..."
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.purple} />
          </View>
        ) : (
          <>
            {/* Sugerencias */}
            {suggestions.length > 0 && searchQuery.length < 2 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sugerencias</Text>
                {suggestions.map((u) => (
                  <PlayerCard
                    key={u.id}
                    {...u}
                    actionLabel={pendingRequests.includes(u.id) ? '✓ Enviado' : '+ Agregar'}
                    onAction={() => handleAddFriend(u.id)}
                    onPress={() => openConversation(u)}
                  />
                ))}
              </View>
            )}

            {/* Amigos / resultados de búsqueda */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchQuery.length >= 2 ? 'Resultados' : `Amigos${friends.length > 0 ? ` (${friends.length})` : ''}`}
              </Text>
              {displayFriends.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons
                    name={searchQuery.length >= 2 ? 'search-off' : 'people-outline'}
                    size={rw(36)}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery.length >= 2
                      ? 'Sin resultados para tu búsqueda'
                      : 'Buscá usuarios para agregarlos como amigos'}
                  </Text>
                  {searchQuery.length >= 2 && (
                    <PlayerCard
                      id="_none"
                      name="¿No está? Intentá con otro nombre"
                      avatar=""
                      gamesInCommon={0}
                      isOnline={false}
                      actionLabel=""
                      onAction={() => {}}
                      onPress={() => {}}
                      disabled
                    />
                  )}
                </View>
              ) : (
                displayFriends.map((u) => (
                  searchQuery.length >= 2 ? (
                    // En búsqueda mostramos opción de agregar
                    <PlayerCard
                      key={u.id}
                      {...u}
                      actionLabel={pendingRequests.includes(u.id) ? '✓ Enviado' : '+ Agregar'}
                      onAction={() => handleAddFriend(u.id)}
                      onPress={() => openConversation(u)}
                    />
                  ) : (
                    // En lista de amigos mostramos chat row
                    <ChatRow
                      key={u.id}
                      name={u.name}
                      avatar={u.avatar}
                      isOnline={u.isOnline}
                      onPress={() => openConversation(u)}
                    />
                  )
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  // Under16
  blockIconCircle: { width: rw(90), height: rw(90), borderRadius: rw(45), alignItems: 'center', justifyContent: 'center', marginBottom: rh(16) },
  blockTitle:      { fontSize: rf(20), fontWeight: '700', textAlign: 'center', marginBottom: rh(8) },
  blockSubtitle:   { fontSize: rf(14), textAlign: 'center', lineHeight: rh(22) },
  // Social
  screenHeader:    { padding: rs.md, paddingBottom: rh(20), gap: rh(14) },
  screenTitle:     { color: colors.text, fontSize: rf(24), fontWeight: '700' },
  loading:         { height: rh(180), alignItems: 'center', justifyContent: 'center' },
  section:         { paddingHorizontal: rs.md, marginBottom: rh(20), gap: rh(10) },
  sectionTitle:    { color: colors.text, fontSize: rf(16), fontWeight: '600' },
  emptyBox:        { alignItems: 'center', paddingVertical: rh(28), gap: rh(10) },
  emptyText:       { color: colors.textMuted, fontSize: rf(14), textAlign: 'center' },
  // Chat
  chatHeader:      { flexDirection: 'row', alignItems: 'center', padding: rs.md, borderBottomWidth: 1, gap: rw(12) },
  backBtn:         {},
  chatUserInfo:    { flex: 1 },
  chatName:        { color: colors.text, fontSize: rf(16), fontWeight: '600' },
  chatStatus:      { fontSize: rf(12) },
  messagesArea:    { flex: 1, backgroundColor: colors.background },
  inputBar:        { flexDirection: 'row', alignItems: 'flex-end', padding: rs.md, borderTopWidth: 1, gap: rw(10) },
  msgInput:        {
    flex: 1, color: colors.text, backgroundColor: colors.background,
    borderRadius: rw(20), borderWidth: 1, paddingHorizontal: rs.md,
    paddingVertical: rh(10), fontSize: rf(15), maxHeight: rh(100),
  },
  sendBtn:         { width: rw(42), height: rw(42), borderRadius: rw(21), alignItems: 'center', justifyContent: 'center' },
});
