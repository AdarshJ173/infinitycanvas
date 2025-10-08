"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(18, 5, 20)",     // Dark Matter background start
  gradientBackgroundEnd = "rgb(12, 12, 12)",      // Dark Matter background end
  firstColor = "231, 138, 83",                    // Primary color (coral/orange)
  secondColor = "95, 135, 135",                   // Secondary color (teal)
  thirdColor = "180, 110, 90",                    // Warmer teal variation
  fourthColor = "210, 120, 70",                   // Orange variation
  fifthColor = "100, 145, 145",                   // Lighter teal
  pointerColor = "95, 135, 135",                  // Teal for mouse interaction
  size = "70%",
  blendingValue = "hard-light",
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  const interactiveRef = useRef<HTMLDivElement>(null);

  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);
  useEffect(() => {
    document.body.style.setProperty(
      "--gradient-background-start",
      gradientBackgroundStart
    );
    document.body.style.setProperty(
      "--gradient-background-end",
      gradientBackgroundEnd
    );
    document.body.style.setProperty("--first-color", firstColor);
    document.body.style.setProperty("--second-color", secondColor);
    document.body.style.setProperty("--third-color", thirdColor);
    document.body.style.setProperty("--fourth-color", fourthColor);
    document.body.style.setProperty("--fifth-color", fifthColor);
    document.body.style.setProperty("--pointer-color", pointerColor);
    document.body.style.setProperty("--size", size);
    document.body.style.setProperty("--blending-value", blendingValue);
  }, []);

  useEffect(() => {
    function move() {
      if (!interactiveRef.current) {
        return;
      }
      setCurX(curX + (tgX - curX) / 20);
      setCurY(curY + (tgY - curY) / 20);
      interactiveRef.current.style.transform = `translate(${Math.round(
        curX
      )}px, ${Math.round(curY)}px)`;
    }

    move();
  }, [tgX, tgY, curX, curY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "h-full w-full relative overflow-hidden bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
        containerClassName
      )}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className={cn("", className)}>{children}</div>
      <div
        className={cn(
          "gradients-container h-full w-full blur-lg",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
        )}
      >
        {/* TOP LEFT CORNER - ORANGE - STAYS IN CORNER */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.9)_0,_rgba(var(--first-color),_0.5)_25%,_rgba(var(--first-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[65%] h-[65%] top-[-25%] left-[-20%]`,
            `[transform-origin:top_left]`,
            `animate-first`,
            `opacity-100`
          )}
        ></div>
        
        {/* TOP RIGHT CORNER - ORANGE WARM - STAYS IN CORNER */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.9)_0,_rgba(var(--fourth-color),_0.5)_25%,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[65%] h-[65%] top-[-25%] left-[80%]`,
            `[transform-origin:top_right]`,
            `animate-fourth`,
            `opacity-100`
          )}
        ></div>
        
        {/* TOP CENTER - TEAL - PASSES THROUGH CENTER */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0.4)_25%,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[55%] h-[55%] top-[-20%] left-[40%]`,
            `[transform-origin:center_top]`,
            `animate-third`,
            `opacity-90`
          )}
        ></div>
        
        {/* BOTTOM LEFT CORNER - TEAL - STAYS IN CORNER */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.75)_0,_rgba(var(--fifth-color),_0.35)_25%,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[60%] h-[60%] top-[75%] left-[-15%]`,
            `[transform-origin:bottom_left]`,
            `animate-second`,
            `opacity-85`
          )}
        ></div>
        
        {/* BOTTOM RIGHT CORNER - TEAL - STAYS IN CORNER */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.75)_0,_rgba(var(--third-color),_0.35)_25%,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[60%] h-[60%] top-[75%] left-[80%]`,
            `[transform-origin:bottom_right]`,
            `animate-fifth`,
            `opacity-85`
          )}
        ></div>

        {interactive && (
          <div
            ref={interactiveRef}
            className={cn(
              `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_1)_0,_rgba(var(--second-color),_0.7)_20%,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
              `[mix-blend-mode:var(--blending-value)] w-[60%] h-[60%] -top-[30%] -left-[30%] pointer-events-none`,
              `opacity-90`
            )}
          ></div>
        )}
      </div>
    </div>
  );
};
