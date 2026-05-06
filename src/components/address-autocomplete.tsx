"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

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

function loadPlacesLibrary() {
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

function patchShadowDom() {
  if (typeof window === "undefined") return;
  if ((window as any).__gmpShadowPatched) return;
  (window as any).__gmpShadowPatched = true;
  const orig = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    return orig.call(this, { ...init, mode: "open" });
  };
}

const SHADOW_STYLE = `
  .input-container {
    background: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 0.375rem !important;
    box-shadow: none !important;
    height: 2.5rem !important;
  }
  input {
    color: #111827 !important;
    background: transparent !important;
    font-size: 0.875rem !important;
    font-family: inherit !important;
    padding-left: 0.75rem !important;
  }
  .autocomplete-icon { display: none !important; }
  .clear-icon { display: none !important; }
`;

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  onValidSelection,
  allowedPincodes,
  placeholder = "12 Rue de la Paix",
  className,
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  const onAddressSelectRef = useRef(onAddressSelect);
  const onValidSelectionRef = useRef(onValidSelection);
  const allowedPincodesRef = useRef(allowedPincodes);
  const setZoneErrorRef = useRef(setZoneError);
  useEffect(() => { onChangeRef.current = onChange; });
  useEffect(() => { onAddressSelectRef.current = onAddressSelect; });
  useEffect(() => { onValidSelectionRef.current = onValidSelection; });
  useEffect(() => { allowedPincodesRef.current = allowedPincodes; });
  useEffect(() => { setZoneErrorRef.current = setZoneError; });

  useEffect(() => {
    patchShadowDom();
    loadPlacesLibrary()
      .then(() => setIsReady(true))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const el = new google.maps.places.PlaceAutocompleteElement({
      includedRegionCodes: ["fr"],
    });

    el.setAttribute("placeholder", placeholder);
    el.style.colorScheme = "light";
    el.style.width = "100%";

    containerRef.current.appendChild(el);

    const injectShadowStyles = () => {
      const shadow = (el as any).shadowRoot;
      if (!shadow) return;
      if (shadow.querySelector("#gmp-custom-style")) return;
      const style = document.createElement("style");
      style.id = "gmp-custom-style";
      style.textContent = SHADOW_STYLE;
      shadow.appendChild(style);
    };
    injectShadowStyles();
    const timer = setTimeout(injectShadowStyles, 150);

    // The correct event is "gmp-select", and the property is event.placePrediction
    const handleSelect = async (event: Event) => {
      const selectEvent = event as unknown as google.maps.places.PlacePredictionSelectEvent;
      const place = selectEvent.placePrediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents"] });

      const components = place.addressComponents ?? [];
      let streetNumber = "";
      let route = "";
      let city = "";
      let pincode = "";

      for (const component of components) {
        const types = component.types ?? [];
        if (types.includes("street_number")) streetNumber = component.longText ?? "";
        else if (types.includes("route")) route = component.longText ?? "";
        else if (types.includes("locality")) city = component.longText ?? "";
        else if (types.includes("postal_code")) pincode = component.longText ?? "";
      }

      if (pincode && !allowedPincodesRef.current.includes(pincode)) {
        setZoneErrorRef.current(
          `Désolé, nous ne livrons pas dans la zone ${pincode}. Codes postaux acceptés : ${allowedPincodesRef.current.join(", ")}.`
        );
        onChangeRef.current("");
        onValidSelectionRef.current(false);
        return;
      }

      setZoneErrorRef.current(null);
      const addressLine = [streetNumber, route].filter(Boolean).join(" ");
      onChangeRef.current(addressLine);
      onAddressSelectRef.current({ addressLine, city, pincode });
      onValidSelectionRef.current(true);
    };

    el.addEventListener("gmp-select", handleSelect);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("gmp-select", handleSelect);
      if (containerRef.current && el.parentNode === containerRef.current) {
        containerRef.current.removeChild(el);
      }
    };
  }, [isReady, placeholder]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full" />
      {!isReady && (
        <input
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
      )}
      {zoneError && <p className="mt-1 text-xs text-red-500">{zoneError}</p>}
    </div>
  );
}
