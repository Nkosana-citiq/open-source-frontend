import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataSource } from '@angular/cdk/collections';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Observable, BehaviorSubject, merge, of, fromEvent } from 'rxjs';

import { catchError, debounceTime, distinctUntilChanged, finalize, map, tap } from 'rxjs/operators';
import { OpenService, CommonService } from 'src/app/shared/services/open.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import { MainMember } from '../main-members.models';
import { Consultant } from '../../consultants/consultants.models';


import {CollectionViewer, DataSource as dd_source} from "@angular/cdk/collections";

export class MembersDataSource implements dd_source<any> {

    private membersSubject = new BehaviorSubject<any[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);

    constructor(private openService: OpenService) {}

    connect(collectionViewer: CollectionViewer): Observable<any[]> {
      return this.membersSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
      this.membersSubject.complete();
      this.loadingSubject.complete();
    }
  
    loadMembers(url: string, filter = '',
                sortDirection = 'asc', pageIndex = 0, pageSize = 3) {

        this.loadingSubject.next(true);
        this.openService.findMembers(url, filter, sortDirection,
            pageIndex, pageSize).pipe(
            catchError(() => of([])),
            finalize(() => this.loadingSubject.next(false))
        )
        .subscribe(members => this.membersSubject.next(members));
    } 
}


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


export class SMSFormBuilder {
  constructor(private formBuilder: FormBuilder, parlour?: any) {
  }

  buildForm(smsFields, parlour?: any) {
    return this.buildSMSForm(smsFields, parlour);
  }

  buildSMSForm(details, parlour?: any) {
    const from = parlour !== undefined ? parlour.parlour_name : null

    details = details === undefined ? {'message': null, 'from': null, 'to': null, start_date: null, end_date: null} : details;
    return this.formBuilder.group({
      'message': [details.message, [Validators.required, Validators.minLength(2)]],
      'from': [{value: from, disabled: true}, [Validators.required]],
      'to': [details.to, [Validators.required]],
      'start_date': [details.start_date],
      'end_date': [details.end_date]
    });
  }
}


export class PerformanceFormBuilder {
  constructor(private formBuilder: FormBuilder, parlour?: any) {
  }

  buildForm(entity) {
    return this.buildPeromanceForm(entity);
  }

  buildPeromanceForm(details) {
    details = details === undefined ? {'entity': null, 'start_date': null, 'end_date': null} : details;
    return this.formBuilder.group({
      'entity': [details.entity, [Validators.required]],
      'start_date': [details.start_date],
      'end_date': [details.end_date]
    });
  }
}


export class MainMemberDataSource extends DataSource<any> {

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
  selector: 'app-main-member-list',
  templateUrl: './main-member-list.component.html',
  styleUrls: ['./main-member-list.component.css']
})
export class MainMemberListComponent implements OnInit {

  displayedColumns = ['full_name', 'id_number', 'contact', 'extended_members', 'premium', 'policy_num', 'policy', 'other', 'date_joined', 'status', 'actions'];
  main_members: Array<any> = [];
  main_member: any;
  formBuilder: SearchFormBuilder;
  smsFormBuilder: SMSFormBuilder;
  perfomanceBuilder: PerformanceFormBuilder;
  form: FormGroup;
  smsForm: FormGroup;
  searchField: null;
  performanceForm: FormGroup;
  smsFields: null;
  status: null;
  dataSource: any;
  page: any;
  loadingState: any;
  tableSize: number;
  permission: any;
  parlour_id: any;
  parlour: any;
  ageLimitExceeded = false;
  user: any;
  message_parts: number;
  message_length: number;
  consultant: any;
  consultant_full_name: any;
  branch: any;
  consultants: Array<Consultant> = [];
  branches: Array<string> = [];
  filter: string;
  total_count = 0;
  extendedMemberAgeLimit = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild("dataBlock") block: ElementRef;
  @ViewChild('input') input: ElementRef;

  constructor(
    public openService: OpenService,
    public service: CommonService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private fc: FormBuilder,
    private pf: FormBuilder,
    private toastr: ToastrService) { 
      this.formBuilder = new SearchFormBuilder(fb);
      this.smsFormBuilder = new SMSFormBuilder(fc);
      this.perfomanceBuilder = new PerformanceFormBuilder(pf);
    }

  ngOnInit(): void {
    this.permission = this.openService.getPermissions();
    this.user = this.openService.getUser();
    this.transition(this.user);

    if (this.permission == "Consultant") {
      this.parlour = this.user.parlour;
    }
    this.parlour_id = this.openService.getParlourId()
    this.dataSource = new MembersDataSource(this.openService);
    this.initParlour(this.parlour_id);
    this.initConsultants(this.parlour_id);
    this.initSearchForm(this.searchField);

    this.initSMSForm(this.smsFields, this.parlour);
    this.initPerformanceForm(this.consultant);
    this.initMainMembers(this.user.id)
    this.totalCount();
  }

  totalCount() {
    this.openService.getUrl(`parlours/${this.parlour_id}/main-members/actions/count?permission=${this.permission}&user_id=${this.user.id}`)
      .subscribe(
        (count: any) => {
          this.total_count = count["count"];
        },
      error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
      });
  }

  loadMembersPage() {
    let url = `${this.permission.toLowerCase()}s/${this.user.id}/main-members/all`;
    this.dataSource.loadMembers(url, '',  this.sort.direction, 
        this.paginator.pageIndex, this.paginator.pageSize);
  }

  toDate(created) {
    return created.split(" ")[0];
  }

  isParlour() {
    return this.permission == 'Parlour';
  }

  isConsultant() {
    return this.permission == 'Consultant';
  }

  isMemberConsultant(main_member: any) {
    return this.permission == 'Consultant' && main_member && this.user.id == main_member.applicant.consultant.id;
  }

  initializePaginator() {
    this.dataSource.paginator = this.paginator;
  }

  onPaginatorChange(event: any) {
    this.page = event;
    this.dataSource = new MainMemberDataSource(this.main_members, this.page);
  }

  initSMSForm(smsFields, parlour?: any) {
    this.smsForm = this.smsFormBuilder.buildForm(smsFields, parlour);
  }

  initPerformanceForm(entity) {
    this.performanceForm = this.perfomanceBuilder.buildForm(entity)
  }

  initSearchForm(searchField: string) {
    this.form = this.formBuilder.buildForm(searchField);
  }

  initMainMembers(id) {
    this.main_members = [];
    const permission = this.permission;
    this.page = {
      'pageSize': 5,
      'pageIndex': 0,
    };

    this.loadingState = 'loading';
    this.dataSource = new MainMemberDataSource([], this.page);

    this.openService.getUrl(`${permission.toLowerCase()}s/${id}/main-members/all`)
      .subscribe(
        (main_members: Array<any>) => {
          this.status = null;
          this.searchField = null;
          this.main_members = main_members;
          this.isAgeLimitExceeded(main_members);
          this.configureMainMembers(main_members);
          this.loadingState = 'complete';
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  ageLimitException(main_member?: MainMember) {
    this.openService.put(`main-members/${main_member.id}/exception`, {"age_limit_exception": true})
      .subscribe(
        (main: any) => {
          main_member = main;
          this.initMainMembers(this.user.id);
          this.showExceptSuccess();
        },
      error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
      });
  }

  setConsultant(consultant) {
    this.consultant = consultant;
    this.consultant_full_name = `${this.consultant.first_name} ${this.consultant.last_name}`;
    let btn = document.getElementById("openConsultantPerfomanceModal");
    btn.click();
  }

  setBranch(branch) {
    this.branch = branch;
    let btn = document.getElementById("openBranchPerfomanceModal");
    btn.click();
  }

  getByConsultant() {
    let queryString = ``;
    const formValue = this.performanceForm.value;
    this.branch = null;
    if (this.status) {
      queryString = `&status=${this.status}`
    }

    if (this.searchField) {
      queryString = queryString ? `${queryString}&search_string=${this.searchField}` : `search_string=${this.searchField}`;
    }

    let filter = `consultant_id=${this.consultant.id}`
    if (formValue['start_date']) {
      const start_date = formValue['start_date'];
      filter = `${filter}&start_date=${start_date}`;
    }

    if (formValue['end_date']) {
      const end_date = formValue['end_date'];
      filter = `${filter}&end_date=${end_date}`;
    }

    queryString = queryString ? `${queryString}&${filter}` : `${filter}`;
    this.filter = queryString;

    this.openService.getUrl(`${this.permission.toLowerCase()}s/${this.user.id}/main-members/all?${queryString}`)
      .subscribe(
        (main_members: any) => {
          this.main_members = main_members;
          this.branch = null;
          this.initPerformanceForm(undefined);
          this.configureMainMembers(main_members);
          this.loadingState = 'complete';
        },
      error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
      });
  }

  getByBranchConsultant(consultant: any) {
    let filter = `consultant_id=${consultant.id}`
    this.openService.getUrl(`${this.permission.toLowerCase()}s/${this.user.id}/main-members/all?${filter}`)
      .subscribe(
        (main_members: any) => {
          this.consultant = consultant;
          this.main_members = main_members;
          this.configureMainMembers(main_members);
          this.loadingState = 'complete';
        },
      error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
      });
  }

  getByBranch(branch: any) {
    let queryString = ``;
    const formValue = this.performanceForm.value;
    this.consultant = null;
    if (this.status) {
      queryString = `&status=${this.status}`
    }

    if (this.searchField) {
      queryString = queryString ? `${queryString}&search_string=${this.searchField}` : `search_string=${this.searchField}`;
    }

    let filter = `branch=${this.branch}`
    if (formValue['start_date']) {
      const start_date = formValue['start_date'];
      filter = `${filter}&start_date=${start_date}`;
    }

    if (formValue['end_date']) {
      const end_date = formValue['end_date'];
      filter = `${filter}&end_date=${end_date}`;
    }

    queryString = queryString ? `${queryString}&${filter}` : `${filter}`;
    this.filter = queryString;
    this.openService.getUrl(`${this.permission.toLowerCase()}s/${this.user.id}/main-members/all?${queryString}`)
      .subscribe(
        (main_members: any) => {
          this.main_members = main_members;
          this.consultant = null;
          this.initPerformanceForm(undefined);
          this.configureMainMembers(main_members);
          this.loadingState = 'complete';
        },
      error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
      });
  }

  getByParlour() {
    let queryString: string;
    const formValue = this.performanceForm.value;

    if (this.status) {
      queryString = `status=${this.status}`
    }

    if (this.searchField) {
      queryString = queryString ? `${queryString}&search_string=${this.searchField}` : `search_string=${this.searchField}`;
    }

    let filter = ``;
    if (formValue['start_date']) {
      const start_date = formValue['start_date'];
      filter = `${filter}&start_date=${start_date}`;
    }

    if (formValue['end_date']) {
      const end_date = formValue['end_date'];
      filter = `${filter}&end_date=${end_date}`;
    }

    queryString = queryString ? `${queryString}&${filter}` : `${filter}`;
    this.filter = queryString;
    this.openService.getUrl(`${this.permission.toLowerCase()}s/${this.user.id}/main-members/all?${queryString}`)
      .subscribe(
        (main_members: any) => {
          this.main_members = main_members;
          this.branch = null;
          this.consultant = null;
          this.initPerformanceForm(undefined);
          this.configureMainMembers(main_members);
          this.loadingState = 'complete';
        },
      error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
      });
  }

  showExceptSuccess() {
    this.toastr.success('', 'Success!!!');
  }

  getDocUrl(main_member) {
    const id = main_member.id;
    const applicant = main_member.applicant
    const base_url = this.openService.getBaseUrl();
    if (applicant.old_url) {
      return applicant.document;
    }
    return `${base_url}/main-members/${id}/document`;
  }

  getOtherDocUrl() {
    if (this.main_member) {
      const id = this.main_member.id;
      const applicant = this.main_member.applicant
      const base_url = this.openService.getBaseUrl();

      return `${base_url}/main-members/${id}/personal_docs`;
    }
    return null
  }

  hasPersonalFiles(main_member) {
    const id = main_member.id;
    const applicant = main_member.applicant;
    this.main_member = main_member;
    const base_url = this.openService.getBaseUrl();
    if(applicant.personal_docs) {
      const anchor = <HTMLAnchorElement>document.getElementById("viewFile")
      anchor.href = applicant.personal_docs.search("opensource.cutag.co.za") == -1 ? `${base_url}/main-members/${id}/personal_docs` : applicant.personal_docs;
      anchor.click()
    }
  }

  initParlour(parlour_id) {
    this.openService.getOne(`parlours/${parlour_id}`)
      .subscribe(
        (parlour: any) => {
          this.parlour = parlour;
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  isCurrentConsultant(main_member: any) {
    return main_member.applicant.consultant.id == this.user.id || this.isParlour();
  }

  navigateToNotifications() {
    this.router.navigate(['parlours', this.user.id, 'notifications']);
  }

  initConsultants(parlour_id) {
    this.openService.getOne(`parlours/${parlour_id}/consultants/`)
      .subscribe(
        (consultants: any) => {
          this.consultants = consultants;

          for(let consultant of consultants) {
            if (this.branches.includes(consultant.branch)){
              continue;
            }
            this.branches.push(consultant.branch);
          }
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  transition(user: any) {
    this.service.switchHeader(user);
  }

  configureMainMembers(main_members: Array<any>): void {
    this.dataSource = new MatTableDataSource(main_members);
    this.initializePaginator()
  }

  navigateToPaymentForm(main_member: any) {
    this.router.navigate(['main-members', main_member.id, 'payment', 'form']);
  }

  navigateToMainMemberAddForm() {
    this.router.navigate(['main-members', 'form']);
  }

  navigateToMainMemberBulkAddForm() {
    this.router.navigate(['main-members', 'bulk-add']);
  }
  navigateToMainMemberForm(main_member: any) {
    this.router.navigate(['main-members', main_member.id,'form']);
  }

  navigateToExtendedMembersListView(id: number) {
    this.router.navigate(['main-members', id,'extended-members', 'all']);
  }

  navigateToPaymentsForm(id: number) {
    this.router.navigate(['applicants', id,'extended-members', 'all']);
  }

  navigateToInvoiceList(main_member) {
    const id = main_member.applicant.id;
    this.router.navigate(['applicants', id,'invoices']);
  }

  confirmDeleteApplicant(main_member: any) {
    this.main_member = main_member;
    const button = document.getElementById('deleteApplicant');
    button.click();
  }

  handleDelete(main_member) {
    this.openService.delete(`main-members/${main_member.id}/archive`)
      .subscribe(
        (main: any) => {
          this.main_members = this.main_members.filter(val => {
            if (val.id != main_member.id) {
              return val;
            }
          });
          this.configureMainMembers(this.main_members);
          this.toastr.success('Main member has been deleted!', 'Success');
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  isAgeLimitExceeded(members) {
    for (let member of members) {
      if(member.age_limit_exceeded) {
        this.ageLimitExceeded = true;
        break;
      }
    }
  }

  getByPaymentPaid() {
    this.getByPaymentStatus('paid');  
  }

  getByPaymentUnpaid() {
    this.getByPaymentStatus('unpaid');
  }

  getByPaymentSkipped() {
    this.getByPaymentStatus('Skipped');
  }
  
  getByPaymentLapsed() {
    this.getByPaymentStatus('lapsed');
  }

  getByPaymentStatus(status) {
    this.filter = `status=${status}`
    this.openService.getUrl(`${this.permission.toLowerCase()}s/${this.user.id}/main-members/all?status=${status}`)
      .subscribe(
        (main_members: Array<any>) => {
          this.status = status;
          this.searchField = null;
          this.main_members = main_members;
          this.configureMainMembers(main_members);
          this.loadingState = 'complete';
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  getAgeLimitNotice() {
    this.openService.getUrl(`${this.permission.toLowerCase()}s/${this.user.id}/main-members/all?notice=1`)
      .subscribe(
        (main_members: Array<any>) => {
          if (main_members) {
            this.main_members = main_members;
            this.configureMainMembers(main_members);
            this.loadingState = 'complete';
          }
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  getBySearchField() {
    const formValue = this.form.value;
    this.filter = `search_string=${formValue["searchField"]}`;
    this.openService.getUrl(`${this.permission.toLowerCase()}s/${this.user.id}/main-members/all?search_string=${formValue["searchField"]}`)
      .subscribe(
        (main_members: Array<any>) => {
          this.status = null;
          this.searchField = formValue["searchField"];

          this.main_members = main_members;
          this.configureMainMembers(main_members);
          this.loadingState = 'complete';
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  showSuccess() {
    this.toastr.success('Success', 'Toastr fun!');
  }

  counter(value: number) {
    this.message_parts = Math.ceil(value/160);
    return 160 * this.message_parts; 
  }

  getConsultantPaymentsExcel(consultant?: any) {
    let queryString = consultant ? `?consultant_id=${consultant.id}` : ''
    return `${this.openService.getBaseUrl()}/${this.user.id}/invoices/actions/export_to_excel${queryString}`;
  }

  getExcel() {
    let queryString= `permission=${this.permission}`;

    if (this.status) {
      queryString = `${queryString}&status=${this.status}`
    }

    if (this.consultant) {
      queryString = `${queryString}&consultant_id=${this.consultant.id}`
    }else if (this.branch) {
      queryString = `${queryString}&branch=${this.branch}`
    }

    return `${this.openService.getBaseUrl()}/actions/${this.user.id}/export_to_excel?${queryString}`
  }

  sendSMS() {
    let formValues = this.smsForm.value;
    if (this.status) {
      formValues['state'] = this.status;
    }
    if (this.searchField) {
      formValues['search_string'] = this.searchField;
    }

    formValues['parlour_id'] = this.parlour_id;
    formValues['consultant_id'] = this.permission == "Consultant" ? this.user.id : null;
    formValues['branch'] = this.permission == "Consultant" ? this.user.branch : null;

    this.openService.post(`main-members/send-sms`, formValues)
      .subscribe(
        (result: Array<any>) => {
          this.toastr.success('SMSes sent successfully!', '');
          this.parlour = result['parlour'];
        },
        error => {
          let err = error['error'];
          this.toastr.error(err['description'], error['title'], {timeOut: 3000});
        });
  }

  getNumberOfSMS() {
    return this.parlour !== undefined && this.parlour.number_of_sms !== undefined ? this.parlour.number_of_sms : 0;
  }

  noExtendedMembers(main_member) {
    if (main_member) {
      let plan = main_member.applicant.plan;

      if (!plan.extended_members && !plan.consider_age && !plan.additional_extended_members && !plan.spouse){
        return false;
      }
    }
    return true;
  }

  getExtendedMemberAgeLimitNotice(main_member) {
    return main_member.extended_member_limit;
  }

  setMainmemberOtherConsultant(main_member) {
    this.main_member = main_member;
    const btn = document.getElementById("openOtherConsultantModal");
    btn.click();
  }
}