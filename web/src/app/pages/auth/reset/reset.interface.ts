export interface ResetInterface {
  token: string;
  new_password: string;
  confirm_password?: string;
}

export interface ResetResponseInterface {
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
    acknowledged: boolean;
    matched_count: number;
    modified_count: number;
  }
}

export interface TokenIsExpiredResponseInterface {
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
    is_expired: boolean;
    email: string;
  }
}

