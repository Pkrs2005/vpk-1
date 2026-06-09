export interface BaseViewModel {
  title: string;
}

export interface Group {
  id: number;
  group_name: string;
  faculty: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  group_id: number | null;
  enrollment_year: number;
  group_name?: string;
}

export interface StudentFilters {
  group_id?: string;
}

export enum ErrorStatus {
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
  INTERNAL_SERVER_ERROR = 500,
}
