import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { Company } from '../../models/company.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

declare const bootstrap: any;

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html'
})
export class CompanyComponent implements OnInit {
  companies: Company[] = [];
  companyForm: FormGroup;
  modal: any;

  constructor(
    private companyService: CompanyService,
    private fb: FormBuilder
  ) {
    this.companyForm = this.initForm();
  }

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe(companies => this.companies = companies);
  }

  private initForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      ownerName: [''],
      phoneNo: [null, [Validators.required, Validators.min(1000000000)]],
      address: ['']
    });
  }

  openModal(): void {
    this.modal = new bootstrap.Modal(document.getElementById('companyModal'));
    this.companyForm.reset(); // optional: clear form
    this.modal.show();
  }

  submitForm(): void {
    if (this.companyForm.invalid) return;

    const company: Company = this.companyForm.value;
    this.companyService.addCompany(company).subscribe(() => {
      this.loadCompanies();
      this.modal.hide();
    });
  }
}
