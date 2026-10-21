import { apiRequest } from './api';

export const chatService = {
  async sendMessage(message, history = []) {
    return await apiRequest('/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
      }),
    });
  },
};
