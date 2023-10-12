// 時間差を秒単位で取得
export function getTimeDiff(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

// ある時間から現在までの経過時間を秒単位で取得
export function getElapsedTime(start: Date): number {
  return getTimeDiff(start, new Date());
}

// JSTに変換する
export function toJST(date: Date): Date {
  return new Date(new Date(date).getTime() + 9 * 60 * 60 * 1000);
}
