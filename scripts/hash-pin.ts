// 2차 잠금 PIN 의 해시를 만듭니다. 출력값을 APP_PIN_HASH 환경변수에 넣으세요.
// PIN 숫자 자체는 코드·Git·환경변수 어디에도 저장되지 않습니다.
import { hashPassword } from "better-auth/crypto";
import { isValidPinFormat } from "../src/lib/unlock-token";
import { askHidden, fail } from "./lib/cli";

async function main() {
  const pin = await askHidden("잠금 PIN(숫자 4~12자리): ");
  if (!isValidPinFormat(pin)) throw new Error("PIN 은 숫자 4~12자리여야 합니다.");
  if ((await askHidden("한 번 더 입력: ")) !== pin) throw new Error("두 PIN 이 다릅니다.");
  if (/^(\d)\1+$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) {
    console.log("\n⚠️  같은 숫자 반복이나 연속 숫자는 추측하기 쉽습니다. 그래도 계속합니다.");
  }
  const hash = await hashPassword(pin);
  console.log("\n아래 한 줄을 .env.local 과 Vercel 환경변수에 넣으세요:\n");
  console.log(`APP_PIN_HASH="${hash}"\n`);
}

main().catch(fail);
