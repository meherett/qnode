export interface RegisterInterface {
  email: string;
  password: string;
  confirm_password?: string;
}

export interface RegisterResponseInterface {
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
    _id: {
      $oid: string;
    },
    email: string;
    message: string;
    acknowledged: boolean;
  }
}

export interface EmailIsRegisteredResponseInterface {
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
    is_registered: boolean;
    valid: boolean;
  }
}
