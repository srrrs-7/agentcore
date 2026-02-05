import { logger } from "@packages/logger";
import { validateNonEmptyString } from "@packages/request-utils";
import { evaluate } from "mathjs";

interface CalculateRequest {
  expression?: string;
}

interface CalculateResponse {
  result: number;
  expression: string;
}

/**
 * Handle calculator action group requests
 */
export async function handleCalculator(
  apiPath: string,
  body: CalculateRequest | undefined,
): Promise<CalculateResponse> {
  if (apiPath !== "/calculate") {
    throw new Error(`Unknown calculator path: ${apiPath}`);
  }

  const expression = validateNonEmptyString(body?.expression);

  if (!expression) {
    throw new Error("Missing or invalid expression parameter");
  }

  logger.info({
    event: "calculator_evaluate",
    expression,
  });

  try {
    // Use mathjs to safely evaluate the expression
    const result = evaluate(expression);

    // Ensure result is a number
    if (typeof result !== "number" || !Number.isFinite(result)) {
      throw new Error(
        `Expression did not evaluate to a valid number: ${result}`,
      );
    }

    return {
      result,
      expression,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Evaluation failed";
    logger.error({
      event: "calculator_error",
      expression,
      error: message,
    });
    throw new Error(
      `Failed to evaluate expression "${expression}": ${message}`,
    );
  }
}
