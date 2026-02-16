import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  fullWidth = false,
  icon = null,
}) => {
  const baseStyles =
    "font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
    secondary:
      "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500 hover:text-primary-600",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl",
    success:
      "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg",
    outline:
      "bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-50",
  };

  const sizes = {
    sm: "py-2 px-4 text-sm",
    md: "py-2.5 px-6 text-base",
    lg: "py-3 px-8 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass =
    disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
