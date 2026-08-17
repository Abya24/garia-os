import React from "react";
import { Quote } from "lucide-react";
import { DailyQuote } from "../../../data/quotes";
import { AppLanguage } from "../../../utils/i18n";

interface QuoteWidgetProps {
  quote: DailyQuote;
  currentLanguage: AppLanguage;
}

export const QuoteWidget: React.FC<QuoteWidgetProps> = ({ quote, currentLanguage }) => {
  return (
    <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-transparent flex items-start gap-3 relative overflow-hidden shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
        <Quote className="w-4 h-4" />
      </div>
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
            {currentLanguage === "hi" ? "दैनिक प्रेरणा" : "Daily Motivation"}
          </span>
          <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 capitalize">
            {quote.category}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-100 italic leading-relaxed">
          "{currentLanguage === "hi" && quote.hindiTranslation ? quote.hindiTranslation : quote.quote}"
        </p>
        <div className="text-[11px] text-slate-400 font-medium text-right">
          — <span className="text-amber-200">{quote.author}</span>
        </div>
      </div>
    </div>
  );
};
