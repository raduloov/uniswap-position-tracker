export function generateTokenPairSVG(token0Icon: string, token1Icon: string, uniqueId?: string): string {
  // Generate a unique ID for this instance to avoid conflicts
  const id = uniqueId || Math.random().toString(36).substring(7);

  return `
    <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Define clipping masks for each half -->
        <clipPath id="leftHalf-${id}">
          <path d="M 36 0 A 36 36 0 0 0 36 72 Z" />
        </clipPath>
        <clipPath id="rightHalf-${id}">
          <path d="M 36 0 A 36 36 0 0 1 36 72 Z" />
        </clipPath>
        <!-- Circle mask for the entire logo -->
        <clipPath id="circleMask-${id}">
          <circle cx="36" cy="36" r="36" />
        </clipPath>
      </defs>
      
      <!-- Background -->
      <g clip-path="url(#circleMask-${id})">
        <!-- Token icons - full size but clipped to show only half -->
        <!-- Left token: full circle size, centered at circle center, but only left half visible -->
        <image x="-2" y="0" width="72" height="72" href="assets/${token0Icon}" clip-path="url(#leftHalf-${id})" preserveAspectRatio="xMidYMid meet" />
        <!-- Right token: full circle size, centered at circle center, but only right half visible -->
        <image x="2" y="0" width="72" height="72" href="assets/${token1Icon}" clip-path="url(#rightHalf-${id})" preserveAspectRatio="xMidYMid meet" />
      </g>
      
      <!-- Outer border -->
      <circle cx="36" cy="36" r="35.5" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1" />
      
      <!-- White vertical divider line (on top of border) -->
      <line x1="36" y1="0" x2="36" y2="72" stroke="white" stroke-width="3" clip-path="url(#circleMask-${id})" />
    </svg>
  `.trim();
}

export function getTokenIcon(symbol: string): string {
  const iconMap: { [key: string]: string } = {
    WETH: "ether.svg",
    ETH: "ether.svg",
    USDT: "tether.svg",
    USDC: "usdc.svg",
    UNI: "uniswap-logo.svg",
    ARB: "arbitrum.svg"
  };
  return iconMap[symbol.toUpperCase()] || "uniswap-logo.svg";
}
