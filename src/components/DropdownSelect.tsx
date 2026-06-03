import { useEffect, useRef, useState } from "react";

export type DropdownOption = {
  listLabel?: string;
  selectedLabel?: string;
  value: string;
};

type Props = {
  disabled?: boolean;
  id: string;
  name?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder: string;
  required?: boolean;
  value: string;
  variant?: "compact" | "field" | "filter";
};

const SEARCH_FOCUS_DELAY_MS = 50;

export function DropdownSelect({
  disabled = false,
  id,
  name,
  onChange,
  options,
  placeholder,
  required = false,
  value,
  variant = "filter",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      const timerId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, SEARCH_FOCUS_DELAY_MS);
      return () => clearTimeout(timerId);
    }
  }, [isOpen]);

  function selectOption(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
  }

  const filteredOptions = options.filter((option) => {
    const label = (option.listLabel ?? option.selectedLabel ?? option.value).toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  const currentPlaceholder = selectedOption?.selectedLabel ?? selectedOption?.listLabel ?? placeholder;

  return (
    <div className={`dropdown-select dropdown-select--${variant}`} ref={rootRef}>
      {isOpen ? (
        <div className="dropdown-select__trigger dropdown-select__trigger--open">
          <input
            ref={searchInputRef}
            type="text"
            className="dropdown-select__trigger-input"
            placeholder={currentPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onClick={(event) => event.stopPropagation()}
          />
          <span
            aria-hidden="true"
            className="dropdown-select__chevron"
            onClick={() => setIsOpen(false)}
            style={{ cursor: "pointer" }}
          >
            ▲
          </span>
        </div>
      ) : (
        <button
          aria-expanded={false}
          aria-haspopup="listbox"
          className="dropdown-select__trigger"
          disabled={disabled}
          id={id}
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span>{currentPlaceholder}</span>
          <span aria-hidden="true" className="dropdown-select__chevron">
            ▼
          </span>
        </button>
      )}

      {name ? (
        <select
          aria-hidden="true"
          className="dropdown-select__native"
          disabled={disabled}
          name={name}
          onChange={(event) => selectOption(event.target.value)}
          required={required}
          tabIndex={-1}
          value={value}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.selectedLabel ?? option.listLabel}
            </option>
          ))}
        </select>
      ) : null}

      {isOpen ? (
        <div className="dropdown-select__options">
          <ul
            aria-labelledby={id}
            className="dropdown-select__options-list"
            role="listbox"
          >
            <li>
              <button
                aria-selected={!value}
                className="dropdown-select__option"
                onClick={() => selectOption("")}
                role="option"
                type="button"
              >
                {placeholder}
              </button>
            </li>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    aria-selected={option.value === value}
                    className="dropdown-select__option"
                    onClick={() => selectOption(option.value)}
                    role="option"
                    type="button"
                  >
                    {option.listLabel ?? option.selectedLabel}
                  </button>
                </li>
              ))
            ) : (
              <li className="dropdown-select__no-results">
                No results found
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

