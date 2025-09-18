import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Error403 } from './error-403';

describe('Error403', () => {
  let component: Error403;
  let fixture: ComponentFixture<Error403>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Error403]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Error403);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
