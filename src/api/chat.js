import api from "./axios";

export async function postChatMessage(payload) {
  try {
    // Support both JSON messages and multipart file uploads.
    // If caller passes a FormData, send it directly.
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      const response = await api.post('/chat/messages', payload, { withCredentials: true });
      return response.data;
    }

    const providedId = payload && (payload.chatroom_id ?? payload.chatroomId ?? payload.chatroom);

    // When uploading files, accept either `file` (File) or `files` (Array<File>)
    const hasFile = payload && (payload.file || (Array.isArray(payload.files) && payload.files.length > 0));
    if (hasFile) {
      const form = new FormData();
      if (providedId !== undefined && providedId !== null) form.append('chatroom_id', providedId);

      // include an optional text/message field if provided — coerce to string
      let msg = null;
      if (payload && (payload.messages !== undefined)) msg = payload.messages;
      else if (payload && (payload.text !== undefined)) msg = payload.text;
      else if (payload && (payload.message !== undefined)) msg = payload.message;
      if (msg !== null && msg !== undefined) form.append('messages', String(msg));

      if (payload.file) {
        form.append('file', payload.file);
      }
      if (Array.isArray(payload.files)) {
        payload.files.forEach((f) => form.append('files[]', f));
      }

      // allow callers to pass additional fields
      if (payload.meta && typeof payload.meta === 'object') {
        Object.keys(payload.meta).forEach((k) => {
          const v = payload.meta[k];
          if (v !== undefined && v !== null) form.append(k, v);
        });
      }

      const response = await api.post('/chat/messages', form, { withCredentials: true });
      return response.data;
    }

    // fallback: regular JSON message send — ensure messages is a string
    const body = {};
    if (providedId !== undefined && providedId !== null) body.chatroom_id = providedId;
    if (payload && (payload.messages !== undefined)) body.messages = String(payload.messages);
    else if (payload && (payload.text !== undefined)) body.messages = String(payload.text);
    else if (payload && (payload.message !== undefined)) body.messages = String(payload.message);
    else body.messages = String(payload ?? '');

    const response = await api.post('/chat/messages', body, { withCredentials: true });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    throw error;
  }
}

export async function getChatRooms() {
  try {
    // backend route for rooms is /chat/rooms
    const response = await api.get("/chat/rooms", { withCredentials: true });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    throw error;
  }
}

export async function getChatMessages(chatroomId) {
  try {
    // backend exposes messages via query param: /chat/messages?chatroom_id=...
    const response = await api.get(`/chat/messages`, { params: { chatroom_id: chatroomId }, withCredentials: true });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    throw error;
  }
}

export default { postChatMessage, getChatRooms, getChatMessages };
