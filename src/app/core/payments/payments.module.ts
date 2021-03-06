import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentListComponent } from './payment-list/payment-list.component';
import { RouterModule } from '@angular/router';
import { PaymentViewComponent } from './payment-view/payment-view.component';
import { MAT_DATE_LOCALE } from '@angular/material/core'
import { MaterialModule } from '../../material/material.module';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule } from '@angular/forms';
import { PaymentFormComponent } from './payment-form/payment-form.component';
import { PlansModule } from '../plans/plans.module';


const PaymentRouting: ModuleWithProviders<PaymentModule> = RouterModule.forChild([
  {
    path: 'payments',
    pathMatch: 'full',
    component: PaymentListComponent,
    canActivate: []
  },
  {
    path: 'payments/:id/view',
    component: PaymentViewComponent,
    canActivate: []
  },
  {
    path: 'main-members/:member_id/payment/form',
    component: PaymentFormComponent
  }

]);

@NgModule({
  imports: [
    CommonModule,
    PaymentRouting,
    MaterialModule,
    MatListModule,
    MatTooltipModule,
    ReactiveFormsModule,
    PlansModule
  ],
  declarations: [
    PaymentListComponent,
    PaymentViewComponent,
    PaymentFormComponent
  ],
  exports: [
    PaymentListComponent,
    PaymentViewComponent,
    PaymentFormComponent,
    MatListModule,
    MatTooltipModule
  ],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'en-GB'},
  ],
  entryComponents: [PaymentListComponent]
})
export class PaymentModule { }
