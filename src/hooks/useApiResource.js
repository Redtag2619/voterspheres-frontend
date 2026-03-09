import { useEffect, useState } from "react";

export function useApiResource(fetcher, fallbackData = null) {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fetcher();

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load data");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [fetcher]);

  return { data, loading, error, setData };
}
