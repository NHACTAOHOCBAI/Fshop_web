import { useState, useEffect } from "react";
import { BarChart3, CheckCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LivestreamPoll, PollVoteResult } from "@/types/livestream";

type Props = {
    poll: LivestreamPoll | null;
    liveResults: PollVoteResult | null;
    isClosed: boolean;
    onVote: (pollId: number, optionIndex: number) => void;
    onDismiss: () => void;
};

export function LivestreamPollOverlay({ poll, liveResults, isClosed, onVote, onDismiss }: Props) {
    const [selected, setSelected] = useState<number | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        if (poll) {
            setSelected(null);
            setHasVoted(false);
            setMinimized(false);
        }
    }, [poll?.id]);

    if (!poll) return null;

    const displayOptions = liveResults?.options ?? poll.options.map((text, i) => ({
        index: i, text, count: 0, percentage: 0,
    }));
    // Show bars only when real data arrived from server
    const showResults = (hasVoted && liveResults !== null) || isClosed;

    const handleVote = () => {
        if (selected === null) return;
        onVote(poll.id, selected);
        setHasVoted(true);
    };

    return (
        // Absolute inside video container — visible in both normal & fullscreen
        <div className="absolute bottom-10 left-3 z-20 w-64 rounded-xl border border-white/20 bg-black/70 backdrop-blur-sm shadow-xl text-white animate-in slide-in-from-bottom-3 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                <BarChart3 className="size-3.5 shrink-0 text-sky-300" />
                <span className="flex-1 truncate text-xs font-semibold">
                    {isClosed ? "Kết quả bình chọn" : "Bình chọn ngay!"}
                </span>
                {!isClosed && <span className="size-1.5 animate-pulse rounded-full bg-sky-300" />}
                <button onClick={() => setMinimized(v => !v)} className="opacity-70 hover:opacity-100 transition-opacity">
                    {minimized ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
                <button onClick={onDismiss} className="opacity-70 hover:opacity-100 transition-opacity">
                    <X className="size-3.5" />
                </button>
            </div>

            {!minimized && (
                <div className="p-3 space-y-2.5">
                    <p className="text-xs font-medium leading-relaxed opacity-90">{poll.question}</p>

                    <div className="space-y-1.5">
                        {displayOptions.map((opt) => (
                            <button
                                key={opt.index}
                                disabled={showResults}
                                onClick={() => !showResults && setSelected(opt.index)}
                                className={`w-full rounded-lg px-2.5 py-2 text-left text-xs transition-all border ${
                                    selected === opt.index && !showResults
                                        ? "border-sky-400 bg-sky-400/20"
                                        : "border-white/15 bg-white/10 hover:bg-white/20"
                                } ${showResults ? "cursor-default" : "cursor-pointer"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="opacity-90">{opt.text}</span>
                                    {showResults && (
                                        <span className="ml-2 font-bold text-sky-300 shrink-0">{opt.percentage}%</span>
                                    )}
                                </div>
                                {showResults && (
                                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/20">
                                        <div
                                            className="h-full rounded-full bg-sky-400 transition-all duration-700"
                                            style={{ width: `${opt.percentage}%` }}
                                        />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {showResults && (
                        <p className="text-right text-[10px] opacity-50">{liveResults?.totalVotes ?? 0} lượt</p>
                    )}

                    {!hasVoted && !isClosed ? (
                        <Button
                            size="sm"
                            className="w-full h-7 text-xs bg-sky-500 hover:bg-sky-600 border-0"
                            disabled={selected === null}
                            onClick={handleVote}
                        >
                            Bình chọn
                        </Button>
                    ) : isClosed ? (
                        <button onClick={onDismiss} className="w-full rounded-lg border border-white/20 py-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity">
                            Đóng
                        </button>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-green-400 py-0.5">
                            <CheckCircle className="size-3.5" />
                            Đã bình chọn
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
