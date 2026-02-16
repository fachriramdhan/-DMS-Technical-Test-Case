import React from "react";

const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon = null,
  className = "",
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 border-2 ${
            error
              ? "border-red-500 focus:border-red-600"
              : "border-gray-200 focus:border-primary-500"
          } rounded-lg focus:ring-2 ${
            error ? "focus:ring-red-200" : "focus:ring-primary-200"
          } transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
