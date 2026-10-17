"use server";

import { redirect } from "next/navigation";
import { logError, toUserMessage } from "@/lib/errors";
import { checkPinAllowed, clearPinFailures, clearUnlockCookie, recordPinFailure, setUnlockCookie, verifyPin } from "@/lib/pin";
import { PIN_RULES } from "@/lib/constants";
import { requireLoggedIn } from "@/lib/session";
import { isValidPinFormat } from "@/lib/unlock-token";
import { safeNextPath } from "@/lib/utils";

export type UnlockState = { error?: string };

export async function unlockAction(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const info = await requireLoggedIn();
  const pin = String(formData.get("pin") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/"));
  if (!isValidPinFormat(pin)) return { error: "숫자로 된 비밀번호를 입력해 주세요." };

  try {
    const gate = await checkPinAllowed(info.user.id);
    if (!gate.allowed) {
      return { error: `여러 번 틀려서 잠겼습니다. ${Math.max(1, Math.ceil(gate.retryAfterSec / 60))}분 뒤 다시 시도해 주세요.` };
    }
    if (!(await verifyPin(pin))) {
      const result = await recordPinFailure(info.user.id);
      return {
        error: result.locked
          ? `${PIN_RULES.maxFailures}번 틀려서 ${PIN_RULES.lockMinutes}분 동안 잠겼습니다.`
          : `비밀번호가 틀렸습니다. 남은 시도 ${result.remaining}회`,
      };
    }
    await clearPinFailures(info.user.id);
    await setUnlockCookie(info.sessionId);
  } catch (error) {
    logError("unlock", error);
    if (error instanceof Error && error.message.includes("APP_PIN_HASH")) return { error: error.message };
    return { error: toUserMessage(error) };
  }
  redirect(next);
}

/** 지금 잠그기 (자동 잠금에도 사용) */
export async function lockAction(): Promise<void> {
  await requireLoggedIn();
  await clearUnlockCookie();
  redirect("/unlock");
}
