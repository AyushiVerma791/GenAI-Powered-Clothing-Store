import React, { createContext, useContext, useState } from 'react';
import { chatService } from '../services/chatService';

const ChatContext = createContext(null);

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm Aura, your GenAI personal stylist and shopping assistant. Tell me what outfit or piece you're looking for—including style, occasion, size, or budget—and I'll find the best matches from our catalog!",
  recommended_products: [],
  suggested_queries: [
    "Warm winter jackets under $150",
    "Casual summer dresses",
    "Formal office wear for women",
    "Cashmere sweaters in size L",
  ],
  timestamp: new Date().toISOString(),
};

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => setIsOpen((prev) => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (userText) => {
    if (!userText.trim()) return;

    const userMessage = {
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chatService.sendMessage(userText.trim(), history);

      const assistantMessage = {
        role: 'assistant',
        content: response.reply,
        recommended_products: response.recommended_products || [],
        suggested_queries: response.suggested_queries || [],
        model_used: response.model_used,
        is_mock: response.is_mock,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having a brief connection issue. Please feel free to try again or browse our collections directly in the shop!",
          recommended_products: [],
          suggested_queries: ["Browse all jackets", "Shop dresses", "View new arrivals"],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickAsk = (prompt) => {
    openChat();
    sendMessage(prompt);
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        toggleChat,
        openChat,
        closeChat,
        messages,
        isLoading,
        sendMessage,
        quickAsk,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
