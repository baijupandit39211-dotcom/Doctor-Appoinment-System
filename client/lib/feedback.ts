export function getFriendlyErrorMessage(error: unknown, fallback = "Something went wrong.") {
  const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const message = rawMessage.trim();
  const normalized = message.toLowerCase();

  if (!message || message === "Request failed") {
    return fallback;
  }

  if (
    normalized.includes("invalid email") ||
    normalized.includes("wrong password") ||
    normalized.includes("password is incorrect") ||
    normalized.includes("incorrect password") ||
    normalized.includes("invalid credentials")
  ) {
    return "Invalid email or password.";
  }

  if (normalized.includes("unauthorized") || normalized.includes("forbidden") || normalized.includes("access denied")) {
    return "You are not allowed to perform this action.";
  }

  if (normalized.includes("validation") || normalized.includes("must be") || normalized.includes("required")) {
    return "Please check the required fields and try again.";
  }

  if (normalized.includes("email already in use")) {
    return "This email is already in use.";
  }

  if (normalized.includes("failed to load image")) {
    return "Unable to upload the image. Please try another file.";
  }

  return message;
}

