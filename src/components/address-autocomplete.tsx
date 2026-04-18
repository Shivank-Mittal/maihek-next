"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Navigation } from "lucide-react";

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

let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;

function getPlacesLibrary() {
  if (!placesPromise) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!,
      language: "fr",
      region: "FR",
    });
    placesPromise = importLibrary("places") as Promise<google.maps.PlacesLibrary>;
  }
  return placesPromise;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  onValidSelection,
  allowedPincodes,
  placeholder = "12 Rue de la Paix",
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);

  // Keep latest callbacks in refs so the autocomplete listener never goes stale
  const onChangeRef = useRef(onChange);
  const onAddressSelectRef = useRef(onAddressSelect);
  const onValidSelectionRef = useRef(onValidSelection);
  const allowedPincodesRef = useRef(allowedPincodes);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  });
  useEffect(() => {
    onValidSelectionRef.current = onValidSelection;
  });
  useEffect(() => {
    allowedPincodesRef.current = allowedPincodes;
  });

  useEffect(() => {
    getPlacesLibrary()
      .then(() => setIsReady(true))
      .catch(console.error);
  }, []);

  // Initialize autocomplete once — never re-runs because deps are stable refs
  useEffect(() => {
    if (!isReady || !inputRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "fr" },
      fields: ["address_components", "formatted_address"],
    });

    const listener = autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      if (!place.address_components) return;

      let streetNumber = "";
      let route = "";
      let city = "";
      let pincode = "";

      for (const component of place.address_components) {
        const type = component.types[0];
        if (type === "street_number") streetNumber = component.long_name;
        else if (type === "route") route = component.long_name;
        else if (type === "locality") city = component.long_name;
        else if (type === "postal_code") pincode = component.long_name;
      }

      if (pincode && !allowedPincodesRef.current.includes(pincode)) {
        setZoneError(
          `Désolé, nous ne livrons pas dans la zone ${pincode}. Codes postaux acceptés : ${allowedPincodesRef.current.join(", ")}.`
        );
        onChangeRef.current("");
        onValidSelectionRef.current(false);
        return;
      }

      setZoneError(null);
      const addressLine = [streetNumber, route].filter(Boolean).join(" ");
      onChangeRef.current(addressLine);
      onAddressSelectRef.current({ addressLine, city, pincode });
      onValidSelectionRef.current(true);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [isReady]); // only runs once when library is ready

  return (
    <div className="relative">
      <div className="relative">
        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setZoneError(null);
            onValidSelection(false);
          }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
      </div>
      {zoneError && <p className="mt-1 text-xs text-red-500">{zoneError}</p>}
    </div>
  );
}
