import api from "./axios";

export async function postChatMessage(payload) {
  try {
    const response = await api.post("/chat/messages", payload);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    throw error;
  }
}

export async function getChatRooms() {
  try {
    const response = await api.get("/chat/messages");
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    throw error;
  }
}

export async function getChatMessages(chatroomId) {
  try {
    const response = await api.get(`/chat/messages/${chatroomId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    throw error;
  }
}

export default { postChatMessage, getChatRooms, getChatMessages };
