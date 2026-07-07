import React, { useEffect, useState } from "react";

export default function BackToTopButton({ label = "Back To Top", threshold = 420, className = "", align = "right" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function handleScroll() { setVisible(window.scrollY > threshold); }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  function scrollTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <style>{`
        .vs-back-to-top-button{position:fixed;right:24px;bottom:24px;z-index:40;border:1px solid rgba(251,146,60,.42);border-radius:999px;background:linear-gradient(135deg,rgba(251,146,60,.95),rgba(234,88,12,.95));color:#fff7ed;box-shadow:0 18px 36px rgba(0,0,0,.28);cursor:pointer;font-size:11px;font-weight:950;letter-spacing:.08em;min-height:38px;opacity:0;padding:10px 14px;pointer-events:none;text-transform:uppercase;transform:translateY(10px);transition:opacity .16s ease,transform .16s ease,box-shadow .16s ease}
        .vs-back-to-top-button.is-left{left:24px;right:auto}.vs-back-to-top-button.is-visible{opacity:1;pointer-events:auto;transform:translateY(0)}
        .vs-back-to-top-button:hover{box-shadow:0 22px 44px rgba(0,0,0,.34);transform:translateY(-1px)}.vs-back-to-top-button:focus-visible{outline:2px solid rgba(251,146,60,.85);outline-offset:3px}
        @media(max-width:720px){.vs-back-to-top-button{right:14px;bottom:14px}.vs-back-to-top-button.is-left{left:14px;right:auto}}
      `}</style>
      <button type="button" className={["vs-back-to-top-button", visible ? "is-visible" : "", align === "left" ? "is-left" : "", className].filter(Boolean).join(" ")} onClick={scrollTop} aria-label={label}>{label}</button>
    </>
  );
}

