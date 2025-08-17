import { TestBed } from '@angular/core/testing';

import { ThreeDKeyboardService } from './three-d-keyboard.service';

describe('ThreeDKeyboardService', () => {
  let service: ThreeDKeyboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreeDKeyboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
