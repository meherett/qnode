import { TestBed } from '@angular/core/testing';

import { TokenIsExpiredService } from './token-is-expired.service';

describe('TokenIsExpiredService', () => {
  let service: TokenIsExpiredService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenIsExpiredService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
