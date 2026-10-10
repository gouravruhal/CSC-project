import os from 'os';

export interface NetworkEntry {
  name: string;
  ip: string;
  isWifi: boolean;
}

export function getLocalNetworkDetails(): { primaryWifiIp: string | null; allIps: NetworkEntry[] } {
  const interfaces = os.networkInterfaces();
  const allIps: NetworkEntry[] = [];
  let primaryWifiIp: string | null = null;

  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const lower = name.toLowerCase();
        const isWifi =
          lower.includes('wi-fi') ||
          lower.includes('wifi') ||
          lower.includes('wireless') ||
          lower.includes('wlan');

        const entry: NetworkEntry = { name, ip: iface.address, isWifi };
        allIps.push(entry);

        if (isWifi && !primaryWifiIp) {
          primaryWifiIp = iface.address;
        }
      }
    }
  }

  // Fallback if interface wasn't explicitly named "Wi-Fi" (e.g. Ethernet / local subnet)
  if (!primaryWifiIp) {
    const candidate = allIps.find(
      (e) =>
        !e.name.toLowerCase().includes('virtual') &&
        !e.name.toLowerCase().includes('vbox') &&
        !e.name.toLowerCase().includes('bluetooth') &&
        !e.name.toLowerCase().includes('loopback')
    );
    if (candidate) {
      primaryWifiIp = candidate.ip;
    } else if (allIps.length > 0) {
      primaryWifiIp = allIps[0].ip;
    }
  }

  return { primaryWifiIp, allIps };
}
