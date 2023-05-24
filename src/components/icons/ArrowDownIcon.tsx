type IconProps = {
  fill?: string;
  rotate?: string | number;
  size?: string | number;
  height?: string | number;
  width?: string | number;
  label?: string;
}

export const ArrowDownIcon: React.FC<IconProps> = ({
  size,
  height,
  width,
  rotate,
  ...props
}) => {
  return (
    <svg width={size || width || 24} height={size || height || 24} viewBox="0 0 24 24" strokeWidth="1.5" rotate={rotate} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M12 5l0 14"></path>
      <path d="M16 15l-4 4"></path>
      <path d="M8 15l4 4"></path>
    </svg>
  );
};
