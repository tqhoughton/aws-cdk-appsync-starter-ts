export default function (ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
