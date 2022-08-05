import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APIInterface } from '../../api.interface';
import { APIService } from '../../api.service';

@Injectable({
  providedIn: 'root'
})
export class TokenIsExpiredService extends APIService implements APIInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'auth');
  }
}
