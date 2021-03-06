import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk/collections';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, BehaviorSubject, merge } from 'rxjs';

import { map } from 'rxjs/operators';
import { OpenService, CommonService } from 'src/app/shared/services/open.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';


export class SearchFormBuilder {
  constructor(private formBuilder: FormBuilder) {
  }

  buildForm(search) {
    return this.buildSearchForm(search);
  }

  buildSearchForm(details) {
    details = details === undefined ? {'searchField': null} : details;
    return this.formBuilder.group({
      'searchField': [details.search]
    });
  }
}


export class PlanDataSource extends DataSource<any> {

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  dataChange: BehaviorSubject<Array<any>> = new BehaviorSubject<Array<any>>([]);

  constructor(private data1: Array<any> = [], private page: any) {
    super();
  }

  get data(): Array<any> {
    return this.dataChange.value;
  }

  connect(): Observable<Element[]> {
    const displayDataChanges = [
      this.dataChange
    ];
    return merge(...displayDataChanges)
      .pipe(
        map(() => {
          const data2 = this.data1.slice();
          const startIndex = this.page['pageIndex'] * this.page['pageSize'];
          return data2.splice(startIndex, this.page['pageSize']);
        }));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() { }
}

const dialogConfig = new MatDialogConfig();

@Component({
  selector: 'app-plan-list',
  templateUrl: './plan-list.component.html',
  styleUrls: ['./plan-list.component.css']
})
export class PlanListComponent implements OnInit {

  displayedColumns = ['plan', 'cover', 'premium', "actions"];
  plans: Array<any> = [];
  dataSource: any;
  page: any;
  loadingState: any;
  tableSize: number;
  user: any;
  parlour_id: any;
  permission: any;
  plan: any;
  formBuilder: SearchFormBuilder;
  form: FormGroup;
  searchField: null;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public openService: OpenService,
    public service: CommonService,
    public router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService) { 
      this.formBuilder = new SearchFormBuilder(fb);
    }

  ngOnInit(): void {
    this.permission = this.openService.getPermissions();
    this.user = this.openService.getUser();
    this.parlour_id = this.openService.getParlourId();
    this.initPlans();
    this.initSearchForm(this.searchField);
  }

  initSearchForm(searchField: string) {
    this.form = this.formBuilder.buildForm(searchField);
  }

  transition(user: any) {
    this.service.switchHeader(user);
  }

  initializePaginator() {
    this.dataSource.paginator = this.paginator;
  }

  onPaginatorChange(event: any) {
    this.page = event;
    this.dataSource = new PlanDataSource(this.plans, this.page);
  }

  initPlans() {
    this.plans = [];
    this.page = {
      'pageSize': 5,
      'pageIndex': 0,
    };

    this.loadingState = 'loading';
    this.dataSource = new PlanDataSource([], this.page);

    this.openService.getUrl(`parlours/${this.parlour_id}/plans/all`)
      .subscribe(
        (plans: Array<any>) => {
          this.plans = plans;
          this.configurePlans(plans.reverse());
          this.loadingState = 'complete';
        },
        error => {
          console.log(error);
        });
  }

  configurePlans(plans: Array<any>): void {
    this.tableSize = this.plans.length
    this.dataSource = new MatTableDataSource(plans);
    this.initializePaginator()
  }

  navigateToPlanView(plan: any) {
    this.router.navigate(['plans', plan.id,'view']);
  }

  navigateToPlanForm(plan: any) {
    this.router.navigate(['plans', plan.id,'form']);
  }

  navigateToPlainForm(event) {
    event.preventDefault();
    this.router.navigate(['plans', 'form']);
  }

  isParlour() {
    return this.permission == 'Parlour';
  }

  confirmDeletePlan(plan: any) {
    this.plan = plan;
    const button = document.getElementById('deletePlan');
    button.click();
  }

  getBySearchField() {
    const formValue = this.form.value;
    const filter = `search_string=${formValue["searchField"]}`;
    this.openService.getUrl(`parlours/${this.parlour_id}/plans/all?${filter}`)
      .subscribe(
        (plans: Array<any>) => {
          this.plans = plans;
          this.configurePlans(plans.reverse());
          this.loadingState = 'complete';
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  handleDelete(plan) {
    this.openService.delete(`plans/${plan.id}/delete`)
      .subscribe(
        (new_plan: any) => {
          this.toastr.success(`Successfully deleted plan.`, "Success")
          this.plans = this.plans.filter(val => { 
            if (val.id != plan.id) {
              return val;
            }
          });
          this.configurePlans(this.plans.reverse());
          this.initializePaginator()
        },
        error => {
          console.log(error);
          this.toastr.error(error['message'], error['statusText'])
        });
  }
}
