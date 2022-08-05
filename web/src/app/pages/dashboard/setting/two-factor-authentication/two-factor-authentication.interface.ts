export interface Generate2FAResponseInterface {
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
    _id: {
      $oid: string
    },
    email: string,
    password: string,
    is_confirmed: true,
    role: string,
    date_created: Date,
    last_modified: Date,
    theme: string,
    email_notification: true,
    organization: {
      name: string,
      url: string,
      role: string,
      size: string,
      category: string
    },
    "2fa": {
      is_enabled: boolean;
      otp: string;
    },
    qr_2fa: {
      otp: string;
      otp_uri: string;
    }
  }
}

export interface Enable2FAInterface {
  otp: string;
}

export interface Enable2FAResponseInterface {
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
    _id: {
      $oid: string
    },
    email: string,
    password: string,
    is_confirmed: true,
    role: string,
    date_created: Date,
    last_modified: Date,
    theme: string,
    email_notification: true,
    organization: {
      name: string,
      url: string,
      role: string,
      size: string,
      category: string
    },
    "2fa": {
      is_enabled: boolean;
      otp: string;
    }
  }
}

export interface Disable2FAInterface {
  otp: string;
}

export interface Disable2FAResponseInterface {
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
    _id: {
      $oid: string
    },
    email: string,
    password: string,
    is_confirmed: true,
    role: string,
    date_created: Date,
    last_modified: Date,
    theme: string,
    email_notification: true,
    organization: {
      name: string,
      url: string,
      role: string,
      size: string,
      category: string
    },
    "2fa": {
      is_enabled: boolean;
      otp: string;
    }
  }
}
