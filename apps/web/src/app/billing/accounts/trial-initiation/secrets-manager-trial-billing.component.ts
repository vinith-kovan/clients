import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationApiServiceAbstraction as OrganizationApiService } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationCreateRequest } from "@bitwarden/common/admin-console/models/request/organization-create.request";
import { OrganizationKeysRequest } from "@bitwarden/common/admin-console/models/request/organization-keys.request";
import { PaymentMethodType, PlanType } from "@bitwarden/common/billing/enums";
import { PlanResponse } from "@bitwarden/common/billing/models/response/plan.response";
import { ProductType } from "@bitwarden/common/enums";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { OrgKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";

import { BillingSharedModule, PaymentComponent, TaxInfoComponent } from "../../shared";

export interface OrganizationInfo {
  name: string;
  email: string;
}

interface OrganizationKeys {
  encryptedKey: EncString;
  publicKey: string;
  encryptedPrivateKey: EncString;
  encryptedCollectionName: EncString;
}

export interface OrganizationCreatedEvent {
  organizationId: string;
  planDescription: string;
}

enum SubscriptionCadence {
  Monthly,
  Annual,
}

export enum SubscriptionType {
  Teams,
  Enterprise,
}

@Component({
  selector: "app-secrets-manager-trial-billing",
  templateUrl: "secrets-manager-trial-billing.component.html",
  imports: [BillingSharedModule],
  standalone: true,
})
export class SecretsManagerTrialBillingComponent implements OnInit {
  @ViewChild(PaymentComponent) paymentComponent: PaymentComponent;
  @ViewChild(TaxInfoComponent) taxInfoComponent: TaxInfoComponent;
  @Input() organizationInfo: OrganizationInfo;
  @Input() subscriptionType: SubscriptionType;
  @Output() steppedBack = new EventEmitter();
  @Output() organizationCreated = new EventEmitter<OrganizationCreatedEvent>();

  loading = true;

  annualCadence = SubscriptionCadence.Annual;
  monthlyCadence = SubscriptionCadence.Monthly;

  formGroup = this.formBuilder.group({
    cadence: [SubscriptionCadence.Annual, Validators.required],
  });
  formPromise: Promise<string>;

  applicablePlans: PlanResponse[];
  annualPlan: PlanResponse;
  monthlyPlan: PlanResponse;

  constructor(
    private apiService: ApiService,
    private cryptoService: CryptoService,
    private encryptService: EncryptService,
    private i18nService: I18nService,
    private formBuilder: FormBuilder,
    private messagingService: MessagingService,
    private organizationApiService: OrganizationApiService,
    private platformUtilsService: PlatformUtilsService,
  ) {}

  async ngOnInit(): Promise<void> {
    const plans = await this.apiService.getPlans();
    this.applicablePlans = plans.data.filter(this.isApplicable);
    this.annualPlan = this.findPlanFor(SubscriptionCadence.Annual);
    this.monthlyPlan = this.findPlanFor(SubscriptionCadence.Monthly);
    this.loading = false;
  }

  async submit(): Promise<void> {
    const execute = async (): Promise<string> => {
      const organizationKeys = await this.makeOrganizationKeys();
      return await this.createOrganization(organizationKeys);
    };

    this.formPromise = execute();

    const organizationId = await this.formPromise;
    const planDescription = this.getPlanDescription();

    this.platformUtilsService.showToast(
      "success",
      this.i18nService.t("organizationCreated"),
      this.i18nService.t("organizationReadyToGo"),
    );

    this.organizationCreated.emit({
      organizationId,
      planDescription,
    });

    this.messagingService.send("organizationCreated", organizationId);
  }

  protected changedCountry() {
    this.paymentComponent.hideBank = this.taxInfoComponent.taxInfo.country !== "US";
    if (
      this.paymentComponent.hideBank &&
      this.paymentComponent.method === PaymentMethodType.BankAccount
    ) {
      this.paymentComponent.method = PaymentMethodType.Card;
      this.paymentComponent.changeMethod();
    }
  }

  protected stepBack() {
    this.steppedBack.emit();
  }

  private async createOrganization(keys: OrganizationKeys): Promise<string> {
    const request = new OrganizationCreateRequest();

    request.key = keys.encryptedKey.encryptedString;
    request.keys = new OrganizationKeysRequest(
      keys.publicKey,
      keys.encryptedPrivateKey.encryptedString,
    );
    request.collectionName = keys.encryptedCollectionName.encryptedString;

    request.name = this.organizationInfo.name;
    request.billingEmail = this.organizationInfo.email;

    const [paymentToken, paymentMethodType] = await this.paymentComponent.createPaymentToken();
    request.paymentToken = paymentToken;
    request.paymentMethodType = paymentMethodType;

    const plan = this.findPlanFor(this.formGroup.value.cadence);
    request.planType = plan.type;
    request.additionalSeats = 1;
    request.useSecretsManager = true;
    request.additionalSmSeats = 1;

    request.billingAddressPostalCode = this.taxInfoComponent.taxInfo.postalCode;
    request.billingAddressCountry = this.taxInfoComponent.taxInfo.country;

    if (this.taxInfoComponent.taxInfo.includeTaxId) {
      request.taxIdNumber = this.taxInfoComponent.taxInfo.taxId;
      request.billingAddressLine1 = this.taxInfoComponent.taxInfo.line1;
      request.billingAddressLine2 = this.taxInfoComponent.taxInfo.line2;
      request.billingAddressCity = this.taxInfoComponent.taxInfo.city;
      request.billingAddressState = this.taxInfoComponent.taxInfo.state;
    }

    const organization = await this.organizationApiService.create(request);
    return organization.id;
  }

  private findPlanFor(cadence: SubscriptionCadence) {
    switch (this.subscriptionType) {
      case SubscriptionType.Teams:
        return cadence === SubscriptionCadence.Annual
          ? this.applicablePlans.find((plan) => plan.type === PlanType.TeamsAnnually)
          : this.applicablePlans.find((plan) => plan.type === PlanType.TeamsMonthly);
      case SubscriptionType.Enterprise:
        return cadence === SubscriptionCadence.Annual
          ? this.applicablePlans.find((plan) => plan.type === PlanType.EnterpriseAnnually)
          : this.applicablePlans.find((plan) => plan.type === PlanType.EnterpriseMonthly);
    }
  }

  private getPlanDescription(): string {
    const plan = this.findPlanFor(this.formGroup.value.cadence);
    const price =
      plan.SecretsManager.basePrice === 0
        ? plan.SecretsManager.seatPrice
        : plan.SecretsManager.basePrice;

    switch (this.formGroup.value.cadence) {
      case SubscriptionCadence.Annual:
        return `${this.i18nService.t("annual")} ($${price}/${this.i18nService.t("yr")})`;
      case SubscriptionCadence.Monthly:
        return `${this.i18nService.t("monthly")} ($${price}/${this.i18nService.t("monthAbbr")})`;
    }
  }

  private isApplicable(plan: PlanResponse): boolean {
    const hasSecretsManager = !!plan.SecretsManager;
    const isTeamsOrEnterprise =
      plan.product === ProductType.Teams || plan.product === ProductType.Enterprise;
    const notDisabledOrLegacy = !plan.disabled && !plan.legacyYear;
    return hasSecretsManager && isTeamsOrEnterprise && notDisabledOrLegacy;
  }

  private async makeOrganizationKeys(): Promise<OrganizationKeys> {
    const [encryptedKey, key] = await this.cryptoService.makeOrgKey<OrgKey>();
    const [publicKey, encryptedPrivateKey] = await this.cryptoService.makeKeyPair(key);
    const encryptedCollectionName = await this.encryptService.encrypt(
      this.i18nService.t("defaultCollection"),
      key,
    );
    return {
      encryptedKey,
      publicKey,
      encryptedPrivateKey,
      encryptedCollectionName,
    };
  }
}
