'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Link as LinkIcon, Shield, FileText, Trash2, Phone, ExternalLink } from 'lucide-react';
import { ConversationList } from '@/components/conversation-list';
import { MessageView } from '@/components/message-view';
import {
  CONVERSATIONS_QUERY_KEY,
  type ConversationThread,
  fetchConversations,
  groupConversationsByPhoneNumber,
} from '@/lib/inbox-data';

// روابط صفحة الشات الخاصة بك على SnapDeploy
const LEGAL_URLS = {
  privacy: 'https://chatmmmd-6696f.containers.snapdeploy.app/privacy.html',
  terms: 'https://chatmmmd-6696f.containers.snapdeploy.app/terms.html',
  dataDeletion: 'https://chatmmmd-6696f.containers.snapdeploy.app/data-deletion.html',
};

type Tab = 'chats' | 'connect';

export default function Home() {
  // --- الحالات الأصلية ---
  const [selectedThreadKey, setSelectedThreadKey] = useState<string>();
  const queryClient = useQueryClient();

  // --- حالات جديدة للشريط الجانبي ---
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [phoneNumber, setPhoneNumber] = useState('');

  // --- جلب البيانات ---
  const { data: conversations = [] } = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
  });

  const threads = useMemo(
    () => groupConversationsByPhoneNumber(conversations),
    [conversations],
  );

  const selectedThread = selectedThreadKey
    ? threads.find(thread => thread.key === selectedThreadKey)
    : undefined;

  // --- المعالجات الأصلية ---
  const handleSelectThread = (thread: ConversationThread) => {
    setSelectedThreadKey(thread.key);
    setActiveTab('chats'); // التأكد من العودة لتبويب المحادثات عند اختيار محادثة
  };

  const handleTemplateSent = async (phoneNumber: string, phoneNumberId?: string) => {
    const refreshedConversations = await queryClient.fetchQuery({
      queryKey: CONVERSATIONS_QUERY_KEY,
      queryFn: fetchConversations,
      staleTime: 0,
    });
    const phoneNumberKey = phoneNumber.replace(/\D/g, '') || phoneNumber;
    const refreshedThread = groupConversationsByPhoneNumber(refreshedConversations)
      .find(thread =>
        (!phoneNumberId || thread.phoneNumberId === phoneNumberId) &&
        (thread.key.endsWith(`:${phoneNumberKey}`) || thread.phoneNumber === phoneNumber)
      );

    setSelectedThreadKey(refreshedThread?.key ?? (phoneNumberId ? `${phoneNumberId}:${phoneNumberKey}` : phoneNumberKey));
  };

  const handleBackToList = () => {
    setSelectedThreadKey(undefined);
  };

  return (
    <div className="flex h-dvh min-h-dvh w-full overflow-hidden bg-background text-foreground">
      
      {/* ═══════════ الشريط الجانبي (Sidebar) ═══════════ */}
      <aside className="w-16 md:w-64 bg-white border-r border-slate-200 flex flex-col items-center md:items-stretch py-4 gap-2 z-10 flex-shrink-0">
        
        {/* الشعار */}
        <div className="hidden md:flex items-center gap-2 px-6 mb-6">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">W</div>
          <span className="font-bold text-lg">Console</span>
        </div>

        {/* زر المحادثات */}
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
            activeTab === 'chats' ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare size={20} />
          <span className="hidden md:block">المحادثات</span>
        </button>

        {/* زر الربط مع ميتا */}
        <button
          onClick={() => setActiveTab('connect')}
          className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
            activeTab === 'connect' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LinkIcon size={20} />
          <span className="hidden md:block">الربط مع ميتا</span>
        </button>

        <div className="h-px bg-slate-200 my-2 mx-4" />

        {/* روابط السياسات */}
        <a href={LEGAL_URLS.privacy} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
          <Shield size={20} />
          <span className="hidden md:block">سياسة الخصوصية</span>
          <ExternalLink size={14} className="ml-auto hidden md:block text-slate-400" />
        </a>

        <a href={LEGAL_URLS.terms} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
          <FileText size={20} />
          <span className="hidden md:block">الشروط والأحكام</span>
          <ExternalLink size={14} className="ml-auto hidden md:block text-slate-400" />
        </a>

        <a href={LEGAL_URLS.dataDeletion} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
          <Trash2 size={20} />
          <span className="hidden md:block">حذف البيانات</span>
          <ExternalLink size={14} className="ml-auto hidden md:block text-slate-400" />
        </a>

      </aside>

      {/* ═══════════ المحتوى الرئيسي ═══════════ */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'chats' ? (
          /* --- واجهة المحادثات الأصلية --- */
          <>
            <ConversationList
              onSelectThread={handleSelectThread}
              selectedThreadKey={selectedThreadKey}
              isHidden={!!selectedThread}
            />
            <MessageView
              conversationId={selectedThread?.latestConversation.id}
              conversations={selectedThread?.conversations || []}
              phoneNumber={selectedThread?.phoneNumber}
              phoneNumberId={selectedThread?.phoneNumberId}
              inboxPhoneNumber={selectedThread?.inboxPhoneNumber}
              inboxDisplayName={selectedThread?.inboxDisplayName}
              contactName={selectedThread?.contactName}
              lastActiveAt={selectedThread?.lastActiveAt}
              onTemplateSent={handleTemplateSent}
              onBack={handleBackToList}
              isVisible={!!selectedThread}
            />
          </>
        ) : (
          /* --- واجهة الربط مع ميتا --- */
          <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 overflow-y-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full my-auto">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <LinkIcon size={32} />
              </div>
              
              <h2 className="text-2xl font-bold text-center mb-2">الربط مع ميتا</h2>
              <p className="text-slate-500 text-center mb-8 text-sm">
                أدخل رقم هاتفك التجاري لربطه مع WhatsApp Business API
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      placeholder="مثال: +967 771 234 567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  onClick={() => alert('سيتم هنا توجيهك إلى منصة ميتا لربط الرقم (Meta Embedded Signup)')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  بدء الربط
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
