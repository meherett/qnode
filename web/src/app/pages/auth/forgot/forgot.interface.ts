export interface ForgotInterface {
  email: string;
}

export interface ForgotResponseInterface {
  status: {
    name: string;
    code: number;
  },
  error: null | {
    type: string;
    message: string;
    description: string;
  },
  data: null | {
    email: string;
    message: string;
  }
}
