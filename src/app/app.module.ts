import { NgModule, ModuleWithProviders } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { ParloursModule } from './core/parlours/parlours.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { CommonService, OpenService } from './shared/services/open.service';
import { ConsultantModule } from './core/consultants/consultant.module';
import { PlansModule } from './core/plans/plans.module';
import { MainMembersModule } from './core/main-members/main_members.module';
// import { ApplicantModule } from './core/applicants/applicants.module';
import { PaymentModule } from './core/payments/payments.module';
import { ExtendedMembersModule } from './core/extended-members/extended_members.module';
import { ServicesModule } from './core/services/services.module';
import { HomeModule } from './core/home/home.module';
import { LoginModule } from './core/login/login.module';
import { SignupModule } from './core/signup/signup.module';
// import { NavSignInModule } from './core/nav-signin/nav-signin.module';
import { NavbarModule } from './core/navbar/navbar.module';
import { NavbuttonsModule } from './core/nav-buttons/nav-buttons.module';
import { ToastrModule } from 'ngx-toastr';
import { MainMembersArchivedModule } from './core/archived/main-members-archived.module';
import { ExtendedMembersArchivedModule } from './core/archived/extended-members-archived.module';
import { ChangePasswordModule } from './core/change-password/change-password.module'
import { ContactsModule } from './core/contacts/contacts.module';
import { TermsandconditionsComponent } from './termsandconditions/termsandconditions.component';
import { TermsandconditionsModule } from './termsandconditions/termsandconditions.module';
import { InvoiceModule } from './core/invoices/invoices.module';
import { ForgotPasswordModule } from './core/forgot-password/forgot-password.module';
import { ResetPasswordModule } from './core/reset-password/reset-password.module';
import { NotificationsModule } from './core/notifications/notifications.module';


const rootRouting: ModuleWithProviders<AppModule> = RouterModule.forRoot([
  { path: '',
    pathMatch: 'full',
    redirectTo: '/home' }
], { useHash: true });

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [

    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatCardModule,
    RouterModule,
    FormsModule,
    ParloursModule,
    ConsultantModule,
    PlansModule,
    MainMembersModule,
    ExtendedMembersModule,
    ContactsModule ,
    // ApplicantModule,
    PaymentModule,
    ServicesModule,
    HomeModule,
    LoginModule,
    SignupModule,
    TermsandconditionsModule,
    // NavSignInModule,
    NavbarModule,
    NavbuttonsModule,
    MainMembersArchivedModule,
    ExtendedMembersArchivedModule,
    ChangePasswordModule,
    InvoiceModule,
    ForgotPasswordModule,
    ResetPasswordModule,
    NotificationsModule,
    rootRouting,
    ToastrModule.forRoot()
  ],
  providers: [OpenService, CommonService],
  bootstrap: [AppComponent]
  // entryComponents: [HomeComponent]
})
export class AppModule { }
