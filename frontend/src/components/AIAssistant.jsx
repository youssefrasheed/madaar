import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Loader2 } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

const QUICK_QUESTIONS = [
  { label: '📅 أفضل وقت للنشر على إنستجرام', value: 'إيه أفضل وقت أنشر على إنستجرام؟' },
  { label: '💡 أفكار محتوى', value: 'اقترح علي 3 أفكار محتوى مميزة لهذا الأسبوع' },
  { label: '📈 تحسين التفاعل', value: 'إزاي أزود التفاعل على بوستاتي؟' },
  { label: '#️⃣ هاشتاقات', value: 'اقترح هاشتاقات مناسبة لمحتوى التقنية والتكنولوجيا' },
  { label: '🎯 إستراتيجية TikTok', value: 'إزاي ابدأ قناة TikTok ناجحة؟' },
  { label: '📊 تحليل الأداء', value: 'إزاي أقرأ تقارير الأداء وأفهمها؟' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 أهلاً! أنا مساعدك الذكي لإدارة السوشيال ميديا.\n\nأقدر أساعدك في:\n• 📅 أفضل مواعيد النشر\n• 💡 أفكار محتوى إبداعية\n• 📈 تحسين التفاعل والوصول\n• #️⃣ اختيار الهاشتاقات\n• 📊 تحليل وفهم التقارير\n\nاسألني أي حاجة! 🚀',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = {
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: msg });
      const aiMsg = {
        role: 'assistant',
        content: res.data.data.message,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Fallback mock response when backend is not available
      const fallbacks = [
        'أفضل وقت للنشر على إنستجرام في مصر والسعودية هو من 7 إلى 9 مساءً، خصوصاً أيام الخميس والجمعة. 📅',
        'لزيادة التفاعل: استخدم Stories يومياً، اسأل أسئلة في البوستات، ورد على كل التعليقات خلال أول ساعة! 🎯',
        'هاشتاقات مقترحة: #تقنية #تكنولوجيا #برمجة #ذكاء_اصطناعي #مبتكر - استخدم 5-10 هاشتاقات كحد أقصى. #️⃣',
      ];
      const aiMsg = {
        role: 'assistant',
        content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try { await api.delete('/ai/chat'); } catch {}
    setMessages([{
      role: 'assistant',
      content: '🔄 تم مسح المحادثة. كيف أقدر أساعدك؟',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    }]);
    toast.success('تم مسح المحادثة');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">المساعد الذكي</h2>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
              متاح الآن • مدعوم بـ Gemini AI
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          مسح
        </button>
      </div>

      {/* Quick Questions */}
      <div className="px-4 pt-3 pb-2 bg-white border-b">
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> أسئلة سريعة
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q.value}
              onClick={() => sendMessage(q.value)}
              disabled={loading}
              className="whitespace-nowrap text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 transition-colors disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                : 'bg-gradient-to-br from-gray-600 to-gray-800'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="اكتب سؤالك هنا... (Enter للإرسال)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 bg-gray-50"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
