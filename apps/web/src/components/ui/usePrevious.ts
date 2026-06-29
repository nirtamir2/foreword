import { useState } from "react";

export function usePrevious<T>(value: T) {
  const [prevValue, setPrevValue] = useState<T>(value);
  if (value !== prevValue) {
    setPrevValue(value);
  }
  return prevValue;
}
