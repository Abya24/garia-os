import {
  MotivationalQuote,
  MOTIVATIONAL_QUOTES,
  fetchDailyQuote,
} from "../utils/quotes";

export type DailyQuote = MotivationalQuote;
export { MOTIVATIONAL_QUOTES };

export function getDailyQuote(): DailyQuote {
  return fetchDailyQuote();
}

