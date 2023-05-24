type IconProps = {
  fill?: string;
  rotate?: string | number;
  size?: string | number;
  height?: string | number;
  width?: string | number;
  label?: string;
}

export const ArrowLeftIcon: React.FC<IconProps> = ({
  size,
  height,
  width,
  rotate,
  ...props
}) => {
  return (
    <svg width={size || width || 24} height={size || height || 24} viewBox="0 0 24 24" strokeWidth="1.5" rotate={rotate} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M5 12l14 0"></path>
      <path d="M5 12l4 4"></path>
      <path d="M5 12l4 -4"></path>
    </svg>
  );
};
