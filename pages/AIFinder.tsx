// src/pages/AIFinder.tsx
import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { Send, Bot, Loader2, AlertCircle } from 'lucide-react';

const AIFinder = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setErrorMessage(null);

    const newHistory = [...messages, { role: 'user' as const, text: userText }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const aiResponse = await getChatResponse(userText, messages);
      setMessages([...newHistory, { role: 'model' as const, text: aiResponse }]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      setErrorMessage("Connection Error: Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split('**').map((part, index) =>
          index % 2 === 1 ? <strong key={index} className="text-orange-600 font-bold">{part}</strong> : part
        )}
        <br />
      </span>
    ));
  };

  return (
    <div className="flex flex-col min-h-[600px] w-full max-w-5xl mx-auto bg-white">
      
      {/* 1. Welcoming Header (Matches Screenshot) */}
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="mb-4 text-gray-200">
          <Bot size={64} strokeWidth={1} />
        </div>
        <h2 className="text-gray-400 text-xl md:text-2xl text-center font-light tracking-wide">
          Ask about SDS, Chipboard, or Drywall screws!
        </h2>
      </div>

      {/* 2. Chat Messages Display */}
      <div className="flex-1 overflow-y-auto px-4 md:px-20 space-y-6 pb-10">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-orange-500 text-white rounded-tr-none' 
                : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {formatText(m.text)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl animate-pulse">
              <Loader2 className="animate-spin text-orange-500" size={20} />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-xs mx-auto max-w-md">
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* 3. The Pill-Shaped Input Bar (Matches Screenshot) */}
      <div className="sticky bottom-0 bg-white pb-10 pt-4 px-4 md:px-20">
        <form onSubmit={handleChat} className="relative max-w-3xl mx-auto">
          <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all p-1.5 pl-6">
            <input
              className="flex-1 py-3 outline-none text-gray-700 text-base bg-transparent placeholder-gray-300"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our screw range..."
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`p-3 rounded-lg transition-all ${
                input.trim() 
                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md' 
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-300 mt-4 uppercase tracking-[0.2em] font-medium">
            Powered by Classone AI expert
          </p>
        </form>
      </div>
    </div>
  );
};

export default AIFinder;