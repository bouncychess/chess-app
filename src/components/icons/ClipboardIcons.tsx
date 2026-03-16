export function WindowsClipboardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="776 350 234 292"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {/* Yellow highlight - left and bottom inner edge */}
      <path d="m 786.256,379.589 v 252.177 h 19.398 v -9.699 h -9.699 V 389.288 h 193.982 v 9.699 h 9.699 v -19.398 z" fill="#ffff00" />
      {/* White clipboard body */}
      <path d="m 863.849,360.191 v 9.699 h 9.699 v 9.699 h -9.699 v 9.699 h -9.699 v 9.699 H 805.655 V 612.368 H 980.239 V 398.987 H 873.548 v -9.699 h 9.699 v -9.699 h 9.699 v -9.699 h -9.699 v -9.699 z" fill="#ffffff" />
      {/* Light gray clip */}
      <path d="m 883.247,360.191 v 9.698 h 9.701 v 9.698 h -9.701 v 9.701 h -9.698 v 9.698 h 48.496 v -9.698 h -9.701 v -19.399 h 9.701 v -9.698 z m 67.895,38.796 v 9.698 h -96.993 v 9.701 h 106.691 v -19.399 z" fill="#c2c6ca" />
      {/* Dark gray clip shadow and borders */}
      <path d="m 922.044,360.191 v 9.699 h 9.699 v -9.699 z m 0,9.699 h -9.699 v 19.398 h 9.699 v 9.699 h 9.699 9.699 v -9.699 h -9.699 v -9.699 h -9.699 z M 795.956,389.288 v 223.08 h 9.699 V 398.987 h 38.796 v -9.699 z m 155.186,0 v 9.699 h 29.097 v -9.699 z" fill="#85898d" />
      {/* Black outlines */}
      <path d="m 854.149,350.491 v 19.399 h -67.893 v 9.698 h 67.893 v 9.701 h 9.701 v -9.701 h 9.698 v -9.698 h -9.698 v -9.698 h 67.893 v 9.698 h -9.698 v 9.698 h 9.698 v 9.701 h 9.698 v -9.701 h 58.195 v -9.698 H 941.441 V 350.491 Z m 145.487,29.097 v 252.178 h 9.701 V 379.588 Z m 0,252.178 H 786.256 v 9.698 h 213.38 z m -213.38,0 V 379.588 h -9.698 V 631.766 Z M 941.441,389.288 v 9.698 h -87.292 v -9.698 h -9.698 v 19.397 h 106.691 v -19.397 z m 38.798,0 V 612.367 H 795.954 v 9.701 H 989.938 V 389.288 Z" fill="#000000" />
      {/* Olive/gold shadow - right and bottom outer edge */}
      <path d="M 989.938,398.987 V 622.067 H 805.655 v 9.699 H 999.637 V 398.987 Z" fill="#aaaa55" />
      {/* Teal text lines */}
      <path d="m 825.053,398.987 v 38.797 H 805.655 v 9.699 h 19.398 v 19.398 H 805.655 v 9.699 h 19.398 v 19.398 H 805.655 v 9.699 h 19.398 v 19.398 H 805.655 v 9.699 h 19.398 V 554.173 H 805.655 v 9.699 h 19.398 v 19.398 H 805.655 v 9.699 h 19.398 v 19.398 h 9.699 v -19.398 h 145.487 v -9.699 H 834.752 V 563.872 h 145.487 v -9.699 H 834.752 v -19.398 h 145.487 v -9.699 H 834.752 v -19.398 h 145.487 v -9.699 H 834.752 v -19.398 h 145.487 v -9.699 H 834.752 v -38.797 z" fill="#55aaaa" />
      <rect x="834.752" y="437.784" width="145.487" height="9.699" fill="#55aaaa" />
      <rect x="825.053" y="398.987" width="9.699" height="38.797" fill="#55aaaa" />
      <rect x="805.655" y="437.784" width="19.398" height="9.699" fill="#55aaaa" />
      <rect x="805.655" y="466.881" width="19.398" height="9.699" fill="#55aaaa" />
      <rect x="805.655" y="495.978" width="19.398" height="9.699" fill="#55aaaa" />
      <rect x="805.655" y="525.075" width="19.398" height="9.699" fill="#55aaaa" />
      <rect x="805.655" y="554.173" width="19.398" height="9.699" fill="#55aaaa" />
      <rect x="805.655" y="583.270" width="19.398" height="9.699" fill="#55aaaa" />
    </svg>
  );
}

export function ModernCopyIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Back rectangle */}
      <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" />
      {/* Front rectangle */}
      <rect
        x="5.5"
        y="5.5"
        width="9"
        height="9"
        rx="1.5"
        fill={color === "#000000" ? "#fff" : "#f8f8f8"}
      />
    </svg>
  );
}

export function CheckmarkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="#22c55e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3,8 7,12 13,4" />
    </svg>
  );
}
