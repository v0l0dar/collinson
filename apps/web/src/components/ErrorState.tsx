import { Button } from "primereact/button";
import { Message } from "primereact/message";

interface ErrorStateProps {
  code: string;
  message: string;
  onRetry: () => void;
}

const FRIENDLY_TEXT: Record<string, string> = {
  PLACE_NOT_FOUND: "We cannot find this place. Please check the name and try again.",
  UPSTREAM_ERROR: "The weather service did not answer. Please try again.",
  NETWORK_ERROR: "We could not reach the server. Please check your connection.",
};

export function ErrorState({ code, message, onRetry }: ErrorStateProps) {
  const text = FRIENDLY_TEXT[code] ?? message;

  return (
    <div className="mt-6 flex flex-col items-start gap-3">
      <Message severity="error" text={text} />
      <Button label="Try again" outlined onClick={onRetry} size="small" />
    </div>
  );
}
