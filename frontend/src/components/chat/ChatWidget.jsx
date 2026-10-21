import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, CornerDownLeft } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatProductCard from './ChatProductCard';

export default function ChatWidget() {
  const { isOpen, toggleChat, closeChat, messages, isLoading, sendMessage, quickAsk } = useChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-neutral-800 text-white rotate-90 scale-90'
            : 'bg-neutral-900 hover:bg-neutral-800 text-white hover:scale-105 ring-4 ring-amber-500/20'
        }`}
        title="Open AI Personal Stylist"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
        )}
      </button>

      {/* Slide-over Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide">Aura | Fashion AI</h3>
                <p className="text-[10px] text-amber-300/90 font-medium">
                  Powered by Pydantic AI & Groq LPU
                </p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-neutral-900 text-white rounded-tr-none'
                      : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>

                {/* Grounded Recommended Product Cards */}
                {msg.recommended_products && msg.recommended_products.length > 0 && (
                  <div className="w-full mt-3 space-y-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 ml-1">
                      Recommended Matches ({msg.recommended_products.length})
                    </p>
                    {msg.recommended_products.map((item, pIdx) => (
                      <ChatProductCard key={pIdx} item={item} />
                    ))}
                  </div>
                )}

                {/* Suggested Queries */}
                {msg.suggested_queries && msg.suggested_queries.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.suggested_queries.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => quickAsk(suggestion)}
                        className="text-[11px] bg-white hover:bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-all text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 bg-white border border-neutral-200 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm max-w-[60%]">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-neutral-400 ml-2">Aura is consulting catalog...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-neutral-200 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="E.g., Winter coat under $150 in size M..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs bg-neutral-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
