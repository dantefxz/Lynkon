// src/screens/ChatScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/services';
import { EmptyState } from '../components/EmptyState';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

export function ChatScreen({ route }) {
  const { friend } = route.params;
  const { user } = useAuth();

  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState(null);
  const listRef = useRef(null);

  const loadMessages = useCallback(async () => {
    setError(null);
    try {
      const msgs = await messageService.getMessages(user.uid, friend.uid || friend.id);
      setMessages(msgs || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, friend?.uid]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const tempId = `temp_${Date.now()}`;
    const newMsg = {
      messageId: tempId,
      fromUserId: user.uid,
      text: text.trim(),
      sentAt: new Date().toISOString(),
      read: false,
      sending: true,
    };

    // Optimistic update — mostrar el mensaje antes de que el servidor responda
    setMessages((prev) => [...prev, newMsg]);
    setText('');
    setSending(true);

    try {
      await messageService.send(user.uid, friend.uid || friend.id, newMsg.text);
      // Marcar como enviado
      setMessages((prev) =>
        prev.map((m) => m.messageId === tempId ? { ...m, sending: false } : m)
      );
    } catch (err) {
      // Revertir el mensaje optimista
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
      setText(newMsg.text); // devolver el texto al input
      Alert.alert('Error', 'No se pudo enviar el mensaje. Intentá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.fromUserId === user.uid;
    const time  = item.sentAt
      ? new Date(item.sentAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.friendBubble]}>
        <Text style={[styles.msgText, isOwn && styles.ownText]}>{item.text}</Text>
        <View style={styles.msgMeta}>
          <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>{time}</Text>
          {isOwn && (
            <Text style={[styles.statusIcon, isOwn && styles.ownTimestamp]}>
              {item.sending ? '⏳' : item.read ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="No se pudieron cargar los mensajes"
        description={error}
        actionLabel="Reintentar"
        onAction={() => { setLoading(true); loadMessages(); }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.friendName}>{friend.name || friend.username}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, friend.isOnline ? styles.online : styles.offline]} />
            <Text style={styles.statusText}>{friend.isOnline ? 'En línea' : 'Desconectado'}</Text>
          </View>
        </View>
      </View>

      {/* Mensajes */}
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatIcon}>💬</Text>
          <Text style={styles.emptyChatText}>
            Todavía no hay mensajes. ¡Empezá la conversación!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.messageId}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escribí un mensaje..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.sendIcon}>➤</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ms(12) },
  loadingText:    { color: colors.textMuted, fontSize: fs(14) },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: ms(12),
    padding: ms(16), backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar:         { width: 40, height: 40, borderRadius: ms(20) },
  friendName:     { color: colors.text, fontSize: fs(15), fontWeight: '600' },
  statusRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  online:         { backgroundColor: colors.online },
  offline:        { backgroundColor: '#6B7280' },
  statusText:     { color: colors.textMuted, fontSize: fs(12) },

  messageList:    { padding: ms(16) },
  bubble: {
    maxWidth: '75%', borderRadius: ms(16), padding: ms(12), marginBottom: 8,
  },
  friendBubble: {
    backgroundColor: colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4,
  },
  ownBubble: {
    backgroundColor: colors.purple, alignSelf: 'flex-end', borderBottomRightRadius: 4,
  },
  msgText:        { color: colors.textMuted, fontSize: fs(14), lineHeight: 20 },
  ownText:        { color: '#fff' },
  msgMeta:        { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 },
  timestamp:      { color: colors.textMuted, fontSize: fs(10) },
  ownTimestamp:   { color: 'rgba(255,255,255,0.6)' },
  statusIcon:     { fontSize: fs(10) },

  emptyChat:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ms(10), padding: 32 },
  emptyChatIcon:  { fontSize: 48 },
  emptyChatText:  { color: colors.textMuted, fontSize: fs(14), textAlign: 'center' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: ms(12), gap: ms(10),
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.cardAlt, borderRadius: ms(20),
    paddingHorizontal: wp(16), paddingVertical: 10, color: colors.text,
    fontSize: fs(14), maxHeight: 100, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ opacity: 0.4 },
  sendIcon:       { color: '#fff', fontSize: fs(16), marginLeft: 2 },
});
