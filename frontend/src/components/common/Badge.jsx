import React from "react";

const Badge = ({ children, variant = "info", size = "md", className = "" }) => {
  const variants = {
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    primary: "bg-primary-100 text-primary-700",
    secondary: "bg-gray-100 text-gray-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
