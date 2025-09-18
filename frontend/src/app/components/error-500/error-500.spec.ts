import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Error500 } from './error-500';

describe('Error500', () => {
  let component: Error500;
  let fixture: ComponentFixture<Error500>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Error500]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Error500);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
