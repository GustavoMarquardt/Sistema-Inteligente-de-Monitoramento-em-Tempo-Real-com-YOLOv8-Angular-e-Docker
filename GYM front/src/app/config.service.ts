import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public readonly rota: string = 'http://localhost:3000/';
  constructor() { 
    
  }
}
