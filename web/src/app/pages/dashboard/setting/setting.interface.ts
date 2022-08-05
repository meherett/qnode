export interface ResetOldPasswordInterface {
  old_password: string;
  password: string;
  confirm_password?: string;
}

export interface ResetOldPasswordResponseInterface {
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
