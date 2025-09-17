export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const isIOSSafari = () => {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  return ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1 && ua.indexOf('CriOS') === -1;
};

export const getIOSVersion = (): number | null => {
  if (!isIOS()) return null;
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};