import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public getStorage(key: string): any {
    return localStorage.getItem(key);
  }

  public getJSONStorage(key: string): any {
    const item: null | string = localStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item);
  }

  public setStorage(key: string, value: string | boolean): StorageService {
    localStorage.setItem(key, value.toString());
    return this;
  }

  public setJSONStorage(key: string, value: object | object []): StorageService {
    localStorage.setItem(key, JSON.stringify(value));
    return this;
  }

  public clearStorage(key: string): StorageService {
    localStorage.removeItem(key);
    return this;
  }

  public clearJSONStorage(key: string): StorageService {
    localStorage.removeItem(key);
    return this;
  }

  public clear(): StorageService {
    localStorage.clear();
    return this;
  }
}

