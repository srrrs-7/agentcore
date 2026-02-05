import { logger } from "@packages/logger";
import { validateNonEmptyString } from "@packages/request-utils";

interface DateTimeParams {
  timezone?: string;
  datetime?: string;
  fromTimezone?: string;
  toTimezone?: string;
}

interface CurrentTimeResponse {
  iso8601: string;
  unix: number;
  timezone: string;
  formatted: string;
}

interface ConvertTimezoneResponse {
  original: string;
  converted: string;
  fromTimezone: string;
  toTimezone: string;
}

/**
 * Handle datetime action group requests
 */
export async function handleDateTime(
  apiPath: string,
  params: DateTimeParams,
): Promise<CurrentTimeResponse | ConvertTimezoneResponse> {
  switch (apiPath) {
    case "/current-time":
      return getCurrentTime(params.timezone);

    case "/convert-timezone":
      return convertTimezone(
        params.datetime,
        params.fromTimezone,
        params.toTimezone,
      );

    default:
      throw new Error(`Unknown datetime path: ${apiPath}`);
  }
}

/**
 * Get current time in specified timezone
 */
function getCurrentTime(timezone = "UTC"): CurrentTimeResponse {
  logger.info({
    event: "datetime_current_time",
    timezone,
  });

  const now = new Date();

  try {
    const formatted = now.toLocaleString("en-US", {
      timeZone: timezone,
      dateStyle: "full",
      timeStyle: "long",
    });

    return {
      iso8601: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      timezone,
      formatted,
    };
  } catch (error) {
    // Invalid timezone, fall back to UTC
    logger.warn({
      event: "datetime_invalid_timezone",
      timezone,
      error,
    });

    return {
      iso8601: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      timezone: "UTC",
      formatted: now.toLocaleString("en-US", {
        timeZone: "UTC",
        dateStyle: "full",
        timeStyle: "long",
      }),
    };
  }
}

/**
 * Convert datetime between timezones
 */
function convertTimezone(
  datetime: string | undefined,
  fromTimezone: string | undefined,
  toTimezone: string | undefined,
): ConvertTimezoneResponse {
  const validatedDatetime = validateNonEmptyString(datetime);
  if (!validatedDatetime) {
    throw new Error("datetime parameter is required");
  }
  const validatedFromTimezone = validateNonEmptyString(fromTimezone);
  if (!validatedFromTimezone) {
    throw new Error("fromTimezone parameter is required");
  }
  const validatedToTimezone = validateNonEmptyString(toTimezone);
  if (!validatedToTimezone) {
    throw new Error("toTimezone parameter is required");
  }

  logger.info({
    event: "datetime_convert",
    datetime: validatedDatetime,
    fromTimezone: validatedFromTimezone,
    toTimezone: validatedToTimezone,
  });

  try {
    // Parse the input datetime
    const date = new Date(validatedDatetime);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid datetime: ${validatedDatetime}`);
    }

    // Format in source timezone
    const originalFormatted = date.toLocaleString("en-US", {
      timeZone: validatedFromTimezone,
      dateStyle: "full",
      timeStyle: "long",
    });

    // Format in target timezone
    const convertedFormatted = date.toLocaleString("en-US", {
      timeZone: validatedToTimezone,
      dateStyle: "full",
      timeStyle: "long",
    });

    return {
      original: originalFormatted,
      converted: convertedFormatted,
      fromTimezone: validatedFromTimezone,
      toTimezone: validatedToTimezone,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Conversion failed";
    throw new Error(`Failed to convert timezone: ${message}`);
  }
}
