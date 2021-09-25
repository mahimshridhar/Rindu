import { ReactElement } from "react";

export default function Home({
  fill,
  ...props
}: {
  fill: string;
}): ReactElement {
  return (
    <svg viewBox="0 0 512 512" width="24" height="24" {...props}>
      <path
        d="M 256.274 60.84 L 84.324 166.237 L 84.324 443.063 L 193.27 443.063 L 193.27 293.73 L 320.228 293.73 L 320.228 443.063 L 428.222 443.063 L 428.222 165.476 L 256.274 60.84 Z M 256.274 35.95 L 448.452 149.145 L 448.452 464.395 L 300 464.395 L 300 315.062 L 213.499 315.062 L 213.499 464.395 L 64.095 464.395 L 64.095 150.161 L 256.274 35.95 Z"
        fill={fill}
      ></path>
    </svg>
  );
}
