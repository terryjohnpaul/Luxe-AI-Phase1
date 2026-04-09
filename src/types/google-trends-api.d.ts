declare module "google-trends-api" {
  interface TrendOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
  }

  function interestOverTime(options: TrendOptions): Promise<string>;
  function interestByRegion(options: TrendOptions): Promise<string>;
  function relatedQueries(options: TrendOptions): Promise<string>;
  function relatedTopics(options: TrendOptions): Promise<string>;
  function dailyTrends(options: { geo: string }): Promise<string>;
  function realTimeTrends(options: { geo: string; category: string }): Promise<string>;

  const _default: {
    interestOverTime: typeof interestOverTime;
    interestByRegion: typeof interestByRegion;
    relatedQueries: typeof relatedQueries;
    relatedTopics: typeof relatedTopics;
    dailyTrends: typeof dailyTrends;
    realTimeTrends: typeof realTimeTrends;
  };
  export default _default;
}
