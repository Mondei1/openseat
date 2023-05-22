type IconProps = {
  fill?: string;
  size?: string | number;
  height?: string | number;
  width?: string | number;
  label?: string;
}

export const LayerIcon: React.FC<IconProps> = ({
  fill,
  size,
  height,
  width,
  ...props
}) => {
  return (
      <svg
        width={size || width || 24}
        height={size || height || 24}
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M7 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"></path>
        <path d="M17 17v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h2"></path>
      </svg>
  );
};
