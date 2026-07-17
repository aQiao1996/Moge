import type { ApiError, ApiResponse } from './api';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
type Expect<Value extends true> = Value;

type SuccessContract = Expect<
  Equal<
    ApiResponse<{ ok: true }>,
    {
      code: number;
      message: string;
      data: { ok: true };
    }
  >
>;

type ErrorContract = Expect<
  Equal<
    ApiError,
    {
      code: number;
      message: string;
      timestamp: string;
      path: string;
      method: string;
      details?: unknown;
    }
  >
>;

const numericCodeResponse: ApiResponse<{ ok: true }> = {
  code: 200,
  message: 'success',
  data: { ok: true },
};

void numericCodeResponse;
const successContractMatches: SuccessContract = true;
const errorContractMatches: ErrorContract = true;

void successContractMatches;
void errorContractMatches;
