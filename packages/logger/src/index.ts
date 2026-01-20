import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";

const asyncLocalStorage = new AsyncLocalStorage<{ requestId: string }>();

export const runWithRequestId = async <T>(
  requestId: string,
  fn: () => Promise<T>,
): Promise<T> => {
  return asyncLocalStorage.run({ requestId }, fn);
};

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    log(obj) {
      const store = asyncLocalStorage.getStore();
      if (store?.requestId) {
        return { ...obj, requestId: store.requestId };
      }
      return obj;
    },
  },
});
