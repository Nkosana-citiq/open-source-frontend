import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService, OpenService } from 'src/app/shared/services/open.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nav-buttons',
  templateUrl: './nav-buttons.component.html',
  styleUrls: ['./nav-buttons.component.css']
})
export class NavbuttonsComponent implements OnInit {
  user: any
  permission: any
  parlour_id: any;
  userMode: boolean;
  subscription: Subscription;

  constructor(
    public openService: OpenService,
    private service: CommonService,
    private route: ActivatedRoute,
    public router: Router
  ) {
    // this.subscription = this.openService.header
    //     .subscribe(mode => this.userMode = mode);
  }

  ngOnInit(): void {
    const isLoggedOut = localStorage.getItem('logged_out');
    this.permission = this.openService.getPermissions();
    this.user = this.openService.getUser();
    this.parlour_id = this.openService.getParlourId();
    const mode = localStorage.getItem('userMode')

    this.service.data$.subscribe(res => {
        this.userMode = res;
    });

    if (isLoggedOut == 'true') {
      this.userMode = false
    } else {
      this.userMode = true
    }
  }

  redirectToMainMembersList() {
    console.log("Permissions: ", this.permission);
    const view = [`/${this.permission.toLowerCase()}s/${this.user.id}/applicants`];
    this.router.navigate(view);
  }

  redirectToPlansList() {
    const view = [`/parlours/${this.parlour_id}/plans`];
    this.router.navigate(view);
  }

  redirectToConsultantsList() {
    const view = [`/parlours/${this.user.id}/consultants`];
    this.router.navigate(view);
  }

  redirectToArchivedMainMembersList() {
    const permission = this.permission;
    const view = [`/parlours/${this.user.id}/archived-applicants`];
    this.router.navigate(view);
  }

  redirectToArchivedParloursList() {
    const permission = this.permission;
    const view = [`/parlours/archived-parlours`];
    this.router.navigate(view);
  }

  notConsultant(){
    return this.permission != 'Consultant';
  }

  isAdmin() {
    return this.permission == 'admin';
  }
  getEntity() {
    return `${this.permission.toLowerCase()}s` 
  }
}
