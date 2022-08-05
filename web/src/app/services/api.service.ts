import { HttpClient, HttpHeaders, HttpParamsOptions } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { APIInterface } from './api.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class APIService implements APIInterface {

  protected api_model: string;
  protected endpoint = environment.endpoint;

  constructor(
    public httpClient: HttpClient,
    @Inject(String) public model: string | null
  ) {
    this.api_model = model ? model : '';
    this.endpoint = this.endpoint + this.api_model;
  }

  public create(data: any, header?: HttpHeaders, query?: string) {
    if (query === undefined ) { query = ''; }
    // console.log(`CREATE: ${this.endpoint}${query}`);
    return this.httpClient.post(`${this.endpoint}${query}`, data, { headers: header });
  }

  public collection(header?: HttpHeaders, query?: string) {
    if (query === undefined ) { query = ''; }
    // console.log(`COLLECTION: ${this.endpoint}${query}`);
    return this.httpClient.get(`${this.endpoint}${query}`, { headers: header });
  }

  public get(id: string, header?: HttpHeaders, query?: string) {
    if (id === undefined ) { id = ''; }
    if (query === undefined ) { query = ''; }
    // console.log(`GET ${this.endpoint}/${id}${query}`);
    return this.httpClient.get(`${this.endpoint}${id}${query}`, { headers: header });
  }

  public update(id: string, data: any, header?: HttpHeaders, query?: string) {
    if (id === undefined ) { id = ''; }
    if (query === undefined ) { query = ''; }
    // console.log(`UPDATE: ${this.endpoint}/${id}${query}`);
    return this.httpClient.put(`${this.endpoint}${id}${query}`, data, { headers: header });
  }

  public delete(id: string, header?: HttpHeaders, query?: string, data?: any) {
    if (id === undefined ) { id = ''; }
    if (query === undefined ) { query = ''; }
    // console.log(`DELETE: ${this.endpoint}/${id}${query}`);
    return this.httpClient.delete(`${this.endpoint}${id}${query}`, { headers: header, body: data });
  }
}
