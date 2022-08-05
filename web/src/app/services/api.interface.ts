import { HttpHeaders } from '@angular/common/http';


export interface APIInterface {
  // @ts-ignore
  create(data: any, header?: HttpHeaders, query?: string);

  // @ts-ignore
  collection(header?: HttpHeaders, query?: string);

  // @ts-ignore
  get(id: string, header?: HttpHeaders, query?: string);

  // @ts-ignore
  update(id: string, data: any, header?: HttpHeaders, query?: string);

  // @ts-ignore
  delete(id: string, header?: HttpHeaders, query?: string, data?: any);
}
