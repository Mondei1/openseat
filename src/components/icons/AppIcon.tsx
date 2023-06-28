type IconProps = {
  fill?: string;
  size?: string | number;
  height?: string | number;
  width?: string | number;
  label?: string;
  dark?: boolean;
}

export const AppIcon: React.FC<IconProps> = ({
  fill,
  size,
  height,
  width,
  dark,
  ...props
}) => {
  return (
    <svg
      width={size || width || 24}
      height={size || height || 24}
      version="1.1"
      viewBox="0 0 16.933 16.933"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="linearGradient12349" x1="12" x2="12" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stopColor="#0072f5" offset="0" /><stop stopColor="#9750dd" offset="1" />
        </linearGradient><linearGradient id="linearGradient21201" x1="8.7312" x2="8.7312" y1="15.875" y2="1.0583" gradientUnits="userSpaceOnUse"><stop stopColor="#0072f5" offset="0" />
          <stop stopColor="#9750dd" offset="1" /></linearGradient>
      </defs>
      <g>
        <path
          x="1.1906252" y="1.1906252" width="14.552083" height="14.552083" ry="1.4552082" d="m2.6458 1.1906h11.642c0.80618 0 1.4552 0.64902 1.4552 1.4552v11.642c0 0.80618-0.64902 1.4552-1.4552 1.4552h-11.642c-0.80619 0-1.4552-0.64902-1.4552-1.4552v-11.642c0-0.80619 0.64902-1.4552 1.4552-1.4552z"
          fill={dark ? "#000" : "#fff"}
          stroke="url(#linearGradient21201)"
          strokeWidth=".26458" />
        <g transform="matrix(.39688 0 0 .39688 3.7042 3.7042)" fill="none" stroke="url(#linearGradient12349)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <path d="m5 11a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v4a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
          <path d="m5 11v-5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5" />
          <path d="m6 19v2" />
          <path d="m18 19v2" /></g>
      </g>
    </svg>
  );
};
