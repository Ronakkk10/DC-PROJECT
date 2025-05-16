import { getAPIUrl } from "./routing";

// src/utils/logEvent.js
export async function logEvent(userId, eventType, details = {}) {
  try {
    await fetch(getAPIUrl("/log"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        eventType,
        details,
        timestamp: new Date(),
      }),
    });

    console.log("Event logged successfully:", {
      userId,
      eventType,
      details,
    });
  } catch (e) {
    console.error("Logging failed:", e);
  }
}
