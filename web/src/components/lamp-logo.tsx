"use client";

type LampLogoProps = {
  className?: string;
};

export function LampLogo({ className }: LampLogoProps) {
  return (
    <div
      className={`group relative inline-flex items-center justify-center ${className ?? ""}`}
      style={{ width: 32, height: 42 }}
    >
      {/* Light cone, anchored right under the shade opening */}
      <div
        className="pointer-events-none absolute top-[10px] right-[4px] h-16 w-18 translate-x-1/3 rotate-15 bg-[radial-gradient(ellipse_at_top,rgba(244,201,107,0.35),transparent_70%)] opacity-0 blur-[10px] transition-opacity duration-500 ease-out group-hover:opacity-100"
        style={{
          clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
        }}
        aria-hidden="true"
      />
      {/* Tight bulb glow right around the light source */}
      <div
        className="pointer-events-none absolute top-1 right-[2px] h-6 w-6 translate-x-1/4 -translate-y-1/3 bg-[radial-gradient(circle,rgba(244,201,107,0.7),transparent_70%)] opacity-0 blur-[6px] transition-opacity duration-500 ease-out group-hover:opacity-100"
        aria-hidden="true"
      />
      {/* Lamp SVG */}
      <svg
        width="32"
        height="42"
        viewBox="0 0 32 42"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-[filter,transform] duration-500 ease-out group-hover:brightness-125 group-hover:drop-shadow-[0_0_12px_rgba(244,201,107,0.65)] group-hover:-translate-y-px"
      >
        <path
          d="M16.6439 5.22543C16.5093 4.86815 16.6028 4.46875 16.8839 4.20025L20.9806 0.287163C21.2617 0.0186668 21.6798 -0.0706344 22.0538 0.057944L31.3208 3.24354C32.0287 3.48689 32.231 4.35101 31.699 4.85918L21.6704 14.4384C21.1384 14.9466 20.2337 14.7534 19.979 14.0772L16.6439 5.22543Z"
          fill="#F4C96B"
        />
        <path
          d="M10.0072 35.6278V17.9845C10.0072 17.8536 10.0429 17.7251 10.1104 17.613L15.7552 8.29978C15.9682 7.94864 16.4388 7.82859 16.8066 8.03172C17.1745 8.23516 17.3002 8.68551 17.0873 9.03695L11.6915 17.9409C11.5968 18.0972 11.5467 18.2764 11.5467 18.4591V35.6278C11.5467 36.0338 11.2021 36.363 10.7769 36.363C10.3518 36.363 10.0072 36.0338 10.0072 35.6278Z"
          fill="#F4C96B"
        />
        <path
          d="M6.15797 38.0786C6.15797 37.5372 6.59688 37.0983 7.13831 37.0983H14.4146C14.956 37.0983 15.3949 37.5372 15.3949 38.0786C15.3949 38.6201 14.956 39.059 14.4146 39.059H7.13831C6.59688 39.059 6.15797 38.6201 6.15797 38.0786Z"
          fill="#F4C96B"
        />
        <path
          d="M0 41.0197C0 40.4782 0.438914 40.0393 0.980341 40.0393H20.5726C21.114 40.0393 21.5529 40.4782 21.5529 41.0197C21.5529 41.5611 21.114 42 20.5726 42H0.98034C0.438913 42 0 41.5611 0 41.0197Z"
          fill="#F4C96B"
        />
        <path
          d="M28.2959 8.72773C28.8971 9.30201 28.808 10.3182 28.0968 10.9976C27.3856 11.6769 26.3217 11.7621 25.7205 11.1878C25.1193 10.6135 25.2084 9.59729 25.9196 8.91796C26.6308 8.23863 27.6947 8.15346 28.2959 8.72773Z"
          fill="#F4C96B"
        />
      </svg>
    </div>
  );
}

