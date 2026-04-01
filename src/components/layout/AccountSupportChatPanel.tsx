import { useState } from "react";
import { MessageCircle, Send, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type SupportMessage = {
    id: string;
    role: "user" | "shop";
    content: string;
    createdAt: string;
};

const INITIAL_MESSAGES: SupportMessage[] = [
    {
        id: "welcome-shop",
        role: "shop",
        content: "Xin chào! FShop có thể hỗ trợ bạn về đơn hàng, vận chuyển hoặc đổi trả. Bạn cần hỗ trợ gì hôm nay?",
        createdAt: new Date().toISOString(),
    },
];

const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const AccountSupportChatPanel = () => {
    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState<SupportMessage[]>(INITIAL_MESSAGES);

    const sendMessage = () => {
        const trimmedDraft = draft.trim();
        if (!trimmedDraft) {
            return;
        }

        const now = new Date().toISOString();

        setMessages((prev) => [
            ...prev,
            {
                id: `user-${Date.now()}`,
                role: "user",
                content: trimmedDraft,
                createdAt: now,
            },
            {
                id: `shop-${Date.now() + 1}`,
                role: "shop",
                content: "FShop đã nhận tin nhắn của bạn. Bộ phận chăm sóc khách hàng sẽ phản hồi sớm nhất.",
                createdAt: now,
            },
        ]);

        setDraft("");
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Store className="size-4 text-primary" />
                        <h2 className="text-lg font-semibold">Chat với cửa hàng</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Hỗ trợ đơn hàng, vận chuyển, đổi trả và các vấn đề liên quan đến tài khoản mua sắm.
                    </p>
                </div>

            </div>

            <div className="flex min-h-128 flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                    {messages.map((message) => {
                        const isUser = message.role === "user";
                        return (
                            <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                        isUser ? "bg-primary text-primary-foreground" : "border border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    <p className={`mt-1 text-[11px] ${isUser ? "text-primary-foreground/80" : "text-slate-400"}`}>
                                        {formatTime(message.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                        <MessageCircle className="size-3.5" />
                        Tin nhắn sẽ được gửi đến cửa hàng.
                    </div>

                    <div className="flex items-end gap-2">
                        <Textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="Nhập nội dung cần hỗ trợ..."
                            className="min-h-16 resize-none"
                        />
                        <Button type="button" size="icon" onClick={sendMessage} disabled={!draft.trim()}>
                            <Send className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AccountSupportChatPanel;