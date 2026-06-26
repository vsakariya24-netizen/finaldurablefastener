import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const WhatsAppButton = () => {
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const location = useLocation();

  const phoneNumber = "918758700709";
  const message = "Hello, I want to enquire about your screws";

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  // 🔥 Page load + route change logic
  useEffect(() => {
    setVisible(false); // hide immediately on route change

    const timer = setTimeout(() => {
      setVisible(true); // show after delay
    }, 1500); // ⏱ 1.5 sec delay (customizable)

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null; // hide completely

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        animation: "slideIn 0.5s ease-out",
      }}
    >
      {/* Tooltip */}
      {hover && (
        <div
          style={{
            position: "absolute",
            right: "60px",
            bottom: "10px",
            background: "#333",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          Chat with us
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "inline-block",
          backgroundColor: "#25D366",
          borderRadius: "50%",
          padding: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          transform: hover ? "scale(1.1)" : "scale(1)",
          transition: "all 0.3s ease",
          animation: "pulse 1.5s infinite",
        }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          style={{ width: "32px", height: "32px" }}
        />
      </a>

      {/* Animations */}
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
          }

          @keyframes slideIn {
            from { transform: translateX(80px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default WhatsAppButton;