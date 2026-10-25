// Type declaration for @lottiefiles/lottie-player web component loaded via CDN
declare namespace JSX {
  interface IntrinsicElements {
    'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      background?: string;
      speed?: string;
      loop?: boolean | string;
      autoplay?: boolean | string;
      style?: React.CSSProperties;
    };
  }
}
