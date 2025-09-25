import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtectedContactComponent } from './protected-contact.component';

describe('ProtectedContactComponent', () => {
  let component: ProtectedContactComponent;
  let fixture: ComponentFixture<ProtectedContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtectedContactComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtectedContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
