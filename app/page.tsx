'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';

interface Message {
  content: string;
  sender: 'user' | 'bot';
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/muizznaveed-internetworks/30min';

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [userInput]);

  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message || isStreaming) return;

    // Add user message
    setMessages(prev => [...prev, { content: message, sender: 'user' }]);
    setUserInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botContent = '';
      let isBookingTriggered = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'content') {
                  if (!isBookingTriggered) {
                    botContent += data.content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      if (newMessages[newMessages.length - 1]?.sender === 'bot') {
                        newMessages[newMessages.length - 1].content = botContent;
                      } else {
                        newMessages.push({ content: botContent, sender: 'bot' });
                      }
                      return newMessages;
                    });
                  }
                } else if (data.type === 'special' && data.action === 'BOOK_MEETING') {
                  isBookingTriggered = true;
                  // Remove the bot message if it exists
                  setMessages(prev => prev.filter(m => m.sender !== 'bot' || m.content !== botContent));
                  setShowBooking(true);
                } else if (data.type === 'error') {
                  setMessages(prev => [...prev, { content: data.content, sender: 'bot' }]);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { content: 'Sorry, there was an error processing your request.', sender: 'bot' }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />

      <div className="flex h-screen overflow-hidden bg-[#121212] text-white font-sans">
        {/* Sidebar */}
        <div
          className={`w-[260px] bg-[#0f0f0f] flex flex-col border-r-0 p-2
            fixed md:static top-0 left-0 bottom-0 z-50 transition-transform duration-250
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            shadow-[2px_0_24px_rgba(0,0,0,0.5)] md:shadow-none max-w-[280px] md:max-w-none md:w-[260px]`}
        >
          <div className="p-4 border-b-0 mb-2 flex flex-col items-center gap-3">
            <div className="w-[120px] h-[120px] rounded-xl overflow-hidden bg-[#0f0f0f] border border-[#1e1e1e] flex items-center justify-center">
              <Image src="/ivylogo.png" alt="IVY Logo" width={120} height={120} className="object-contain" />
            </div>
            <div className="text-xs text-[#9ca3af] tracking-[0.2em]">IVY</div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {/* Chat history placeholder */}
          </div>

          <div className="p-3 border-t-0">
            <div
              onClick={() => window.open('https://www.internetworks.io', '_blank')}
              className="p-2 my-0.5 rounded-md cursor-pointer text-sm text-white transition-colors hover:bg-[#2f2f2f] flex items-center gap-2"
            >
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Website
            </div>
            <div
              onClick={() => window.open('https://medium.com/@muizznaveed', '_blank')}
              className="p-2 my-0.5 rounded-md cursor-pointer text-sm text-white transition-colors hover:bg-[#2f2f2f] flex items-center gap-2"
            >
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Featured Blogs
            </div>
            <div
              onClick={() => window.open('https://www.linkedin.com/company/inter-networks-io/?viewAsMember=true', '_blank')}
              className="p-2 my-0.5 rounded-md cursor-pointer text-sm text-white transition-colors hover:bg-[#2f2f2f] flex items-center gap-2"
            >
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              LinkedIn
            </div>
          </div>
        </div>

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col bg-[#121212] relative ${isEmpty ? 'empty' : ''}`}>
          {/* Header */}
          <div className="bg-[#121212] border-b-0 h-14 md:h-14 flex items-center justify-between px-3 md:px-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden w-9 h-9 border border-[#2a2a2a] rounded-lg bg-[#161616] text-[#9ca3af] flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div ref={chatContainerRef} className={`flex-1 overflow-y-auto flex flex-col ${isEmpty ? 'hidden' : ''} pb-24 md:pb-0`}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex mb-0 p-4 md:p-4 w-full max-w-3xl mx-auto ${
                  msg.sender === 'user' ? 'justify-end bg-[#121212]' : 'justify-start bg-[#121212]'
                }`}
              >
                <div className={`${
                  msg.sender === 'user'
                    ? 'bg-[#1f1f1f] border border-[#2a2a2a] text-white rounded-[14px] rounded-br-md max-w-[70%] md:max-w-[70%] p-2.5 px-3.5 text-base leading-relaxed'
                    : 'bg-transparent text-[#e7e7e8] max-w-[70%] md:max-w-[70%] p-0 text-base leading-normal whitespace-pre-wrap break-words'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.sender !== 'bot' && (
              <div className="flex mb-0 p-4 w-full max-w-3xl mx-auto justify-start bg-[#121212]">
                <div className="flex items-center gap-2 text-[#8e8ea0] text-base mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 bg-[#8e8ea0] rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.16}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Calendly Booking Widget */}
            {showBooking && (
              <div className="mt-0">
                <div className="flex mb-0 p-4 pt-0 pb-2 w-full max-w-3xl mx-auto justify-start bg-[#121212]">
                  <div className="w-[90%] max-w-[450px] bg-transparent p-0">
                    <div className="bg-transparent rounded-xl p-0 border-0 max-w-full w-full">
                      <div
                        className="calendly-inline-widget rounded-lg overflow-hidden"
                        data-url={calendlyUrl}
                        style={{ width: '100%', height: '680px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Container */}
          <div className={`flex justify-center p-4 bg-[#121212] ${
            isEmpty
              ? 'fixed md:absolute top-1/2 md:top-1/2 left-0 right-0 -translate-y-1/2 md:-translate-y-1/2 z-20 border-t border-[#1e1e1e] md:border-t-0 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4'
              : 'sticky bottom-0 border-t border-[#1e1e1e] z-5'
          }`}>
            <div className={`w-full ${isEmpty ? 'max-w-2xl md:max-w-3xl' : 'max-w-3xl'} relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-2 pr-13 md:p-2 md:pr-13 overflow-hidden flex items-center focus-within:border-[#159f33] ${isEmpty ? 'min-h-[44px] md:min-h-[48px]' : 'min-h-[48px]'}`}>
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything"
                rows={1}
                className={`w-full block p-0 border-none rounded-lg text-base bg-transparent text-white outline-none resize-none ${isEmpty ? 'min-h-[24px] max-h-[96px] md:max-h-[120px]' : 'min-h-[24px] max-h-[120px]'} leading-normal whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden placeholder-[#8e8ea0]`}
              />
              <button
                onClick={sendMessage}
                disabled={!userInput.trim() || isStreaming}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 border-none bg-[#159f33] text-white cursor-pointer rounded-lg flex items-center justify-center text-base transition-colors hover:bg-[#159f33] disabled:bg-[#2f2f2f] disabled:text-[#8e8ea0] disabled:cursor-not-allowed"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #40414f;
        }
      `}</style>
    </>
  );
}
