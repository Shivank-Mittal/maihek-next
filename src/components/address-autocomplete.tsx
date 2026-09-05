"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (parts: { addressLine: string; city: string; pincode: string }) => void;
  onValidSelection: (valid: boolean) => void;
  allowedPincodes: string[];
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

interface Suggestion {
  placeId: string;
  text: string;
}

const DEBOUNCE_MS = 300;
const MIN_INPUT_LENGTH = 3;

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  onValidSelection,
  allowedPincodes,
  placeholder = "12 Rue de la Paix",
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [zoneError, setZoneError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const allowedPincodesRef = useRef(allowedPincodes);
  useEffect(() => {
    allowedPincodesRef.current = allowedPincodes;
  });

  // Close the suggestion list when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up any pending debounce/fetch on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = (input: string) => {
    abortRef.current?.abort();

    if (input.trim().length < MIN_INPUT_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/v1/places/autocomplete?input=${encodeURIComponent(input)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setSuggestions(json.data.suggestions ?? []);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError") console.error("Address suggestion error:", error);
      });
  };

  const handleInputChange = (val: string) => {
    onChange(val);
    setZoneError(null);
    onValidSelection(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS);
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    setIsOpen(false);
    setSuggestions([]);

    try {
      const res = await fetch(
        `/api/v1/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`
      );
      const json = await res.json();

      if (!json.success) {
        console.error("Address details error:", json.error);
        return;
      }

      const { addressLine, city, pincode } = json.data;

      if (pincode && !allowedPincodesRef.current.includes(pincode)) {
        setZoneError(
          `Désolé, nous ne livrons pas dans la zone ${pincode}. Codes postaux acceptés : ${allowedPincodesRef.current.join(", ")}.`
        );
        onChange("");
        onValidSelection(false);
        return;
      }

      setZoneError(null);
      onChange(addressLine);
      onAddressSelect({ addressLine, city, pincode });
      onValidSelection(true);
    } catch (error) {
      console.error("Address details error:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      if (highlightedIndex >= 0) {
        event.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.placeId}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm text-gray-700",
                index === highlightedIndex ? "bg-gray-100" : "hover:bg-gray-50"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion.text}
            </li>
          ))}
        </ul>
      )}
      {zoneError && <p className="mt-1 text-xs text-red-500">{zoneError}</p>}
    </div>
  );
}
