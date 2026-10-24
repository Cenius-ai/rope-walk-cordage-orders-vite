import { useEffect } from "react";

const PRODUCT = "Rope Walk Cordage Orders";

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${PRODUCT}` : PRODUCT;
  }, [title]);
}
