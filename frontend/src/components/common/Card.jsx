import React from "react";

const Card = ({
  children,
  className = "",
  title = null,
  subtitle = null,
  headerAction = null,
  padding = true,
  hover = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
        hover ? "hover:shadow-md transition-shadow duration-200" : ""
      } ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={padding ? "p-6" : ""}>{children}</div>
    </div>
  );
};

export default Card;
