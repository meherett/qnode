export interface ProjectInterface {
  name: string;
  description: string;
}

export interface ProjectResponseInterface {
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
    name: string;
    description: string;
    key: string;
    status: string;
    user_id: {
      $oid: string;
    },
    security: {
      use_basic_auth: boolean,
      basic_auths: any [],
      use_jwt_auth: boolean,
      jwt_auths: any [],
      per_second_requests: number,
      per_day_requests: number,
      allowed_user_agents: string [],
      allowed_origins: string [],
      allowed_methods: string []
    }
    date_created: {
      $date: number
    },
    last_modified: {
      $date: number
    }
    today_statistics: {
      total_valid: number,
      total_invalid: number,
      total_volumes: number
    }
  }
}

export interface ProjectCollectionResponseInterface {
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
    limit: number;
    page: number;
    total: number;
    data: [{
      _id?: {
        $oid: string;
      },
      name?: string;
      description?: string;
      key?: string;
      status?: string;
      user_id?: {
        $oid: string;
      },
      date_created?: {
        $date: number
      },
      last_modified?: {
        $date: number
      }
    }]
  }
}

export interface NewProjectCollectionResponseInterface {
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
      $oid: string
    },
    acknowledged: boolean
  }
}
