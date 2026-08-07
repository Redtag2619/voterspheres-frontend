import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const getScrollAmount = () => {
      const windowScroll =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      const content =
        document.querySelector(".vs-top-content") ||
        document.querySelector("main");

      const contentScroll =
        content?.scrollTop || 0;

      return Math.max(
        windowScroll,
        contentScroll
      );
    };

    const handleScroll = () => {
      setVisible(getScrollAmount() > 300);
    };

    const content =
      document.querySelector(".vs-top-content") ||
      document.querySelector("main");

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    document.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
        capture: true,
      }
    );

    if (content) {
      content.addEventListener(
        "scroll",
        handleScroll,
        {
          passive: true,
        }
      );
    }

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      document.removeEventListener(
        "scroll",
        handleScroll,
        true
      );

      if (content) {
        content.removeEventListener(
          "scroll",
          handleScroll
        );
      }
    };
  }, []);

  const scrollToTop = () => {
    const content =
      document.querySelector(".vs-top-content") ||
      document.querySelector("main");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    document.documentElement.scrollTo?.({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    if (content) {
      content.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  };

  const buttonStyle = {
    position: "fixed",
    right: "26px",
    bottom: "26px",
    zIndex: 99999,

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    minWidth: "94px",
    height: "46px",
    padding: "0 17px",

    border:
      "1px solid rgba(251, 146, 60, 0.48)",

    borderRadius: "14px",

    background:
      "linear-gradient(135deg, #f97316, #ea580c)",

    color: "#ffffff",

    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 800,

    boxShadow: hovered
      ? "0 18px 40px rgba(0,0,0,.34), 0 7px 20px rgba(234,88,12,.30)"
      : "0 12px 32px rgba(0,0,0,.26), 0 4px 12px rgba(234,88,12,.22)",

    cursor: "pointer",

    opacity: visible ? 1 : 0,
    visibility: visible
      ? "visible"
      : "hidden",

    pointerEvents: visible
      ? "auto"
      : "none",

    transform: visible
      ? hovered
        ? "translateY(-2px)"
        : "translateY(0)"
      : "translateY(14px)",

    transition:
      "opacity 180ms ease, visibility 180ms ease, transform 180ms ease, box-shadow 180ms ease",
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      onMouseEnter={() =>
        setHovered(true)
      }
      onMouseLeave={() =>
        setHovered(false)
      }
      aria-label="Back to top"
      title="Back to top"
      style={buttonStyle}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>

      <span>Top</span>
    </button>
  );
}