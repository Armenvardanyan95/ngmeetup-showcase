import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { fromEvent, interval, merge, of } from 'rxjs';
import { bufferWhen, exhaustMap, filter, first, map, skipUntil, switchMap, tap } from 'rxjs/operators';
import { InactivePopupComponent } from '../inactive-popup/inactive-popup.component';

interface Country {
  name: string;
  capital: string;
}

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {
  countries: Country[] = [];
  licenseTypes = ['A', 'B', 'C', 'D', 'E'];
  isDisabled = true;
  isNotWorkingHour = true;
  inactivePopupTimer: number;
  isInactivePopupOpen = false;

  form = this.formBuilder.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    age: ['', Validators.required],
    country: [''],
    licenseType: [''],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly http: HttpClient,
    private readonly matDialog: MatDialog,
  ) { }

  ngOnInit() {
    this.http.get<Country[]>('https://restcountries.eu/rest/v2/all')
        .subscribe(countries => this.countries = countries);

    this.form.valueChanges.subscribe(value => {
      if (value.age < 18) {
        this.isDisabled = true;
      } else if (value.country === 'Armenia') {
        if (value.licenseType === 'D' && value.age < 19) {
          this.isDisabled = true;
        } else if (value.licenseType === 'E' && value.age < 21) {
          this.isDisabled = true;
        } else {
          this.isDisabled = false;
        }
      } else {
        this.isDisabled = true;
      }
    });

    // you-have-been-inactive popup

    // const events = ['click', 'mousemove', 'keydown', 'scroll'];
    // this.resetInactivePopupTimer();
    // for (const event of events) {
    //   window.addEventListener(event, () => this.resetInactivePopupTimer());
    // }

    merge(...['click', 'mousemove', 'keydown', 'scroll'].map(eventName => fromEvent(document.body, eventName))).pipe(
      tap(console.log),
      bufferWhen(() => interval(3_000)),
      filter(events => events.length === 0),
      map(() => this.matDialog.open(InactivePopupComponent)),
      switchMap((dialogRef: MatDialogRef<InactivePopupComponent>) => of(null).pipe(skipUntil(dialogRef.afterClosed()))),
    ).subscribe();

    setInterval(() => this.calculateNotWorkingHour(), 10_000);
  }

  private resetInactivePopupTimer() {
     if (this.inactivePopupTimer) {
       clearTimeout(this.inactivePopupTimer);
     }

     if (this.isInactivePopupOpen === false) {
       this.isInactivePopupOpen = true;
       setTimeout(() => {
         const dialogRef = this.matDialog.open(InactivePopupComponent);
         dialogRef.afterClosed().pipe(first()).subscribe(() => this.isInactivePopupOpen = false);
       }, 5_000);
     }
  }

  private calculateNotWorkingHour() {
    const now = new Date();
    this.isNotWorkingHour = now.getHours() < 9 || now.getHours() > 19;
  }

}
