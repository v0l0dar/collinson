import { Button } from "primereact/button";
import { Message } from "primereact/message";

interface ErrorStateProps {
  code: string;
  message: string;
  onRetry: () => void;
}

// Only the client-only failure needs its own copy here. Server-raised
// errors (e.g. UPSTREAM_ERROR) already carry a user-facing message from
// the API — reusing it avoids two owners drifting on the same sentence.
const CLIENT_ONLY_TEXT: Record<string, string> = {
  NETWORK_ERROR: "We could not reach the server. Please check your connection.",
};

export function ErrorState({ code, message, onRetry }: ErrorStateProps) {
  const text = CLIENT_ONLY_TEXT[code] ?? message;

  return (
    <div className="mt-6 flex flex-col items-start gap-3">
      <Message severity="error" text={text} />
      <Button label="Try again" outlined onClick={onRetry} size="small" />
    </div>
  );
}
