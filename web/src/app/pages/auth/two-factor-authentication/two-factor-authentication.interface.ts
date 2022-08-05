export interface TwoFactorAuthenticationInterface {
  access_token: string;
  otp: string;
}

export interface TwoFactorAuthenticationResponseInterface {
  status: {
    name: string,
    code: number,
  },
  error: null | {
    type: string,
    message: string,
    description: string,
  },
  data: null | {
    token: {
      access_token: string,
      refresh_token: string,
      expiry_date: Date,
      token_type: string
    },
    user: {
      _id: {
        $oid: string,
      },
      email: string,
      is_confirmed: boolean
    },
    "2fa": {
      is_enabled: boolean;
    }
  }
}
