import api from "./axios";

export async function postChatMessage(payload) {
  try {
    // backend expects { chatroom_id, messages }
    const body = {
      chatroom_id: payload.chatroom_id || payload.chatroomId || payload.chatroom || null,
      messages: payload.messages || payload.text || payload.message || payload,
    };
    const response = await api.post("/chat/messages", body, { withCredentials: true });
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
