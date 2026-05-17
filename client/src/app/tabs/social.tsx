import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { friendApi, messageApi, userApi } from '@/services/api';
import { getProfileAvatar } from '@/services/mockData';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { colors } from '@/theme/colors';
import { PlayerCard, ChatRow, ChatBubble, SearchBar } from '@/components';

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

export default function SocialScreen() {
  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await friendApi.getFriends();
        const serverFriends: User[] = (res.data || []).map((f: any) => ({
          id: f.id || f.userId, name: f.username || f.name,
          avatar: f.avatar || getProfileAvatar(f.id || f.userId),
          gamesInCommon: f.gamesInCommon || 0,
          isOnline: f.isOnline || false,
        }));
        setFriends(serverFriends);
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
      setSearchResults((res.data || []).map((u: any) => ({
        id: u.id,
        name: u.username || u.name,
        avatar: u.avatar || getProfileAvatar(u.id),
        gamesInCommon: 0,
        isOnline: false,
      })));
    } catch { setSearchResults([]); }
  };

  const openConversation = async (user: User) => {
    setSelectedUser(user);
    setMessages([]);
    try {
      const res = await messageApi.getConversation(user.id);
      const serverMsgs: Message[] = (res.data || []).map((m: any) => ({
        id: m.id, userId: m.fromUserId, userName: m.fromUsername || user.name,
        message: m.content || m.message, timestamp: m.timestamp || m.createdAt, isOwn: m.isOwn || false,
      }));
      if (serverMsgs.length > 0) setMessages(serverMsgs);
    } catch {}
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser) return;
    const optimistic: Message = {
      id: Date.now().toString(), userId: 'own', userName: 'Yo',
      message: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageText('');
    try { await messageApi.sendMessage(selectedUser.id, optimistic.message); } catch {}
  };

  const handleAddFriend = async (userId: string) => {
    try { await friendApi.sendFriendRequest(userId); } catch {}
  };

  // ── Vista de chat ──────────────────────────────────
  if (selectedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header chat */}
          <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={rw(24)} color={colors.purple} />
            </TouchableOpacity>
            {/* Reutilizamos ChatRow en modo "header" */}
            <View style={styles.chatUserInfo}>
              <Text style={styles.chatName}>{selectedUser.name}</Text>
              <Text style={[styles.chatStatus, { color: selectedUser.isOnline ? colors.online : colors.textMuted }]}>
                {selectedUser.isOnline ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>

          {/* Mensajes — ChatBubble component */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesArea}
            contentContainerStyle={{ padding: rs.md, gap: rh(10) }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
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
              style={[styles.sendBtn, { backgroundColor: colors.purple }]}
              onPress={handleSend}
            >
              <Ionicons name="send" size={rw(18)} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Vista social principal ─────────────────────────
  const displayFriends = searchQuery.length >= 2 ? searchResults : friends;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.screenHeader, { backgroundColor: colors.cardAlt }]}>
          <Text style={styles.screenTitle}>Social</Text>
          {/* SearchBar component */}
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
            {/* Sugerencias — PlayerCard component */}
            {suggestions.length > 0 && searchQuery.length < 2 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sugerencias</Text>
                {suggestions.map((user) => (
                  <PlayerCard
                    key={user.id}
                    {...user}
                    actionLabel="+ Agregar"
                    onAction={() => handleAddFriend(user.id)}
                    onPress={() => openConversation(user)}
                  />
                ))}
              </View>
            )}

            {/* Amigos / resultados — ChatRow component */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchQuery.length >= 2 ? 'Resultados' : 'Amigos'}
              </Text>
              {displayFriends.length === 0 ? (
                <Text style={styles.emptyText}>
                  {searchQuery.length >= 2 ? 'Sin resultados' : 'Aún no tenés amigos agregados'}
                </Text>
              ) : (
                displayFriends.map((user) => (
                  <ChatRow
                    key={user.id}
                    name={user.name}
                    avatar={user.avatar}
                    isOnline={user.isOnline}
                    onPress={() => openConversation(user)}
                  />
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
  container: { flex: 1, backgroundColor: colors.background },
  screenHeader: { padding: rs.md, paddingBottom: rh(20), gap: rh(14) },
  screenTitle: { color: colors.text, fontSize: rf(24), fontWeight: '700' },
  loading: { height: rh(180), alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: rs.md, marginBottom: rh(20), gap: rh(10) },
  sectionTitle: { color: colors.text, fontSize: rf(16), fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: rf(14), textAlign: 'center', paddingVertical: rh(20) },
  // Chat
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: rs.md, borderBottomWidth: 1, gap: rw(12) },
  backBtn: {},
  chatUserInfo: { flex: 1 },
  chatName: { color: colors.text, fontSize: rf(16), fontWeight: '600' },
  chatStatus: { fontSize: rf(12) },
  messagesArea: { flex: 1, backgroundColor: colors.background },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: rs.md, borderTopWidth: 1, gap: rw(10) },
  msgInput: {
    flex: 1, color: colors.text, backgroundColor: colors.background,
    borderRadius: rw(20), borderWidth: 1, paddingHorizontal: rs.md,
    paddingVertical: rh(10), fontSize: rf(15), maxHeight: rh(100),
  },
  sendBtn: { width: rw(42), height: rw(42), borderRadius: rw(21), alignItems: 'center', justifyContent: 'center' },
});
