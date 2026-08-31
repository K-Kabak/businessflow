export type ActionErrorCode =
  "VALIDATION" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "UNKNOWN";
export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | {
      success: false;
      code: ActionErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
export const INITIAL_ACTION_STATE: ActionResult = { success: true };
