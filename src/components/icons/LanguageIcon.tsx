type IconProps = {
  fill?: string;
  size?: string | number;
  height?: string | number;
  width?: string | number;
  label?: string;
}

export const LanguageIcon: React.FC<IconProps> = ({
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
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M4 5h7"></path>
      <path d="M9 3v2c0 4.418 -2.239 8 -5 8"></path>
      <path d="M5 9c0 2.144 2.952 3.908 6.7 4"></path>
      <path d="M12 20l4 -9l4 9"></path>
      <path d="M19.1 18h-6.2"></path>
    </svg>
  );
};
