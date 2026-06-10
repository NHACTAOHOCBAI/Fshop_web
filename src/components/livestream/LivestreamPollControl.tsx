import { useState } from "react";
import { BarChart3, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreatePoll, useClosePoll } from "@/hooks/useLivestreams";
import type { LivestreamPoll, PollVoteResult } from "@/types/livestream";

type Props = {
    livestreamId: number;
    activePoll: LivestreamPoll | null;
    liveResults: PollVoteResult | null;
    onPollCreated: (poll: LivestreamPoll) => void;
    onPollClosed: () => void;
};

export function LivestreamPollControl({
    livestreamId,
    activePoll,
    liveResults,
    onPollCreated,
    onPollClosed,
}: Props) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [showForm, setShowForm] = useState(false);

    const { mutate: create, isPending: isCreating } = useCreatePoll();
    const { mutate: close, isPending: isClosing } = useClosePoll();

    const addOption = () => {
        if (options.length < 4) setOptions([...options, ""]);
    };

    const removeOption = (i: number) => {
        if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
    };

    const updateOption = (i: number, value: string) => {
        setOptions(options.map((opt, idx) => (idx === i ? value : opt)));
    };

    const handleCreate = () => {
        const trimmedQuestion = question.trim();
        const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
        if (!trimmedQuestion || trimmedOptions.length < 2) return;

        create(
            { livestreamId, question: trimmedQuestion, options: trimmedOptions },
            {
                onSuccess: (res) => {
                    if (res.data) {
                        onPollCreated(res.data);
                        setShowForm(false);
                        setQuestion("");
                        setOptions(["", ""]);
                    }
                },
            },
        );
    };

    const handleClose = () => {
        if (!activePoll) return;
        close(
            { livestreamId, pollId: activePoll.id },
            { onSuccess: onPollClosed },
        );
    };

    const displayOptions = liveResults?.options ?? activePoll?.options.map((text, i) => ({
        index: i, text, count: 0, percentage: 0,
    }));

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BarChart3 className="size-4 text-primary" />
                    Live Poll
                </div>
                {!activePoll && !showForm && (
                    <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                        <Plus className="size-3.5 mr-1" /> Tạo bình chọn
                    </Button>
                )}
            </div>

            {/* Form tạo poll */}
            {showForm && !activePoll && (
                <div className="space-y-3">
                    <Input
                        placeholder="Câu hỏi bình chọn..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        maxLength={200}
                    />
                    {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                placeholder={`Phương án ${i + 1}`}
                                value={opt}
                                onChange={(e) => updateOption(i, e.target.value)}
                                maxLength={100}
                            />
                            {options.length > 2 && (
                                <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500">
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {options.length < 4 && (
                        <button onClick={addOption} className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <Plus className="size-3" /> Thêm phương án
                        </button>
                    )}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={handleCreate}
                            disabled={isCreating || !question.trim() || options.filter(Boolean).length < 2}
                        >
                            {isCreating ? "Đang tạo..." : "Bắt đầu bình chọn"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                            Huỷ
                        </Button>
                    </div>
                </div>
            )}

            {/* Active poll — live results */}
            {activePoll && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">{activePoll.question}</p>
                    <div className="space-y-2">
                        {displayOptions?.map((opt) => (
                            <div key={opt.index}>
                                <div className="mb-0.5 flex items-center justify-between text-xs text-slate-600">
                                    <span>{opt.text}</span>
                                    <span className="font-semibold">{opt.percentage}% ({opt.count})</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{ width: `${opt.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400">
                        Tổng: {liveResults?.totalVotes ?? 0} lượt bình chọn
                    </p>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={handleClose}
                        disabled={isClosing}
                    >
                        <Trash2 className="size-3.5 mr-1" />
                        {isClosing ? "Đang đóng..." : "Kết thúc bình chọn"}
                    </Button>
                </div>
            )}

            {/* No poll */}
            {!activePoll && !showForm && (
                <p className="text-center text-xs text-slate-400 py-2">
                    Chưa có bình chọn nào đang chạy
                </p>
            )}
        </div>
    );
}
