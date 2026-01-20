import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";

const asyncLocalStorage = new AsyncLocalStorage<{ requestId: string }>();

export const runWithRequestId = async (
  requestId: string,
  fn: () => Promise<void>,
) => {
  await asyncLocalStorage.run({ requestId }, fn);
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
