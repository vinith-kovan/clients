import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, of } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

import { VaultOnboardingComponent, VaultOnboardingTasks } from "./vault-onboarding.component";

describe("VaultOnboardingComponent", () => {
  let component: VaultOnboardingComponent;
  let fixture: ComponentFixture<VaultOnboardingComponent>;
  let mockPlatformUtilsService: Partial<PlatformUtilsService>;
  let mockApiService: Partial<ApiService>;
  let mockStateService: MockProxy<StateService>;
  let mockPolicyService: MockProxy<PolicyService>;
  let mockI18nService: MockProxy<I18nService>;
  let mockConfigService: MockProxy<ConfigServiceAbstraction>;
  let setInstallExtLinkSpy: any;
  let individualVaultPolicyCheckSpy: any;

  beforeEach(() => {
    mockPolicyService = mock<PolicyService>();
    mockStateService = mock<StateService>();
    mockI18nService = mock<I18nService>();
    mockPlatformUtilsService = mock<PlatformUtilsService>();
    mockApiService = {
      getProfile: jest.fn(),
    };
    mockConfigService = mock<ConfigServiceAbstraction>();

    TestBed.configureTestingModule({
      declarations: [],
      imports: [RouterTestingModule],
      providers: [
        { provide: PlatformUtilsService, useValue: mockPlatformUtilsService },
        { provide: PolicyService, useValue: mockPolicyService },
        { provide: StateService, useValue: mockStateService },
        { provide: I18nService, useValue: mockI18nService },
        { provide: ApiService, useValue: mockApiService },
        { provide: ConfigServiceAbstraction, useValue: mockConfigService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VaultOnboardingComponent);
    component = fixture.componentInstance;
    setInstallExtLinkSpy = jest.spyOn(component, "setInstallExtLink");
    individualVaultPolicyCheckSpy = jest
      .spyOn(component, "individualVaultPolicyCheck")
      .mockReturnValue(undefined);
    // (component as any).apiService.getProfile.mockResolvedValueOnce(new Date());
    jest.spyOn(component, "checkCreationDate").mockReturnValue(null);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should call setInstallExtLink", () => {
      component.ngOnInit();
      expect(setInstallExtLinkSpy).toHaveBeenCalled();
    });

    it("should call individualVaultPolicyCheck", () => {
      component.ngOnInit();
      expect(individualVaultPolicyCheckSpy).toHaveBeenCalled();
    });
  });

  describe("show and hide onboarding component", () => {
    it("should set showOnboarding to true", () => {
      jest
        .spyOn((component as any).stateService, "getVaultOnboardingTasks")
        .mockReturnValue(undefined);
      component.ngOnInit();
      expect((component as any).showOnboarding).toBe(true);
    });

    it("should set showOnboarding to false if dismiss is clicked", () => {
      component.ngOnInit();
      (component as any).hideOnboarding();
      expect((component as any).showOnboarding).toBe(false);
    });
  });

  describe("setInstallExtLink", () => {
    it("should set extensionUrl to Chrome Web Store when isChrome is true", () => {
      jest.spyOn((component as any).platformUtilsService, "isChrome").mockReturnValue(true);
      const expected =
        "https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb";
      component.ngOnInit();
      expect(component.extensionUrl).toEqual(expected);
    });

    it("should set extensionUrl to Firefox Store when isFirefox is true", () => {
      jest.spyOn((component as any).platformUtilsService, "isFirefox").mockReturnValue(true);
      const expected = "https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/";
      component.ngOnInit();
      expect(component.extensionUrl).toEqual(expected);
    });

    it("should set extensionUrl when isSafari is true", () => {
      jest.spyOn((component as any).platformUtilsService, "isSafari").mockReturnValue(true);
      const expected = "https://apps.apple.com/us/app/bitwarden/id1352778147?mt=12";
      component.ngOnInit();
      expect(component.extensionUrl).toEqual(expected);
    });
  });

  describe("individualVaultPolicyCheck", () => {
    it("should set isIndividualPolicyVault to true", async () => {
      individualVaultPolicyCheckSpy.mockRestore();
      const spy = jest
        .spyOn((component as any).policyService, "policyAppliesToActiveUser$")
        .mockReturnValue(of(true));

      await component.individualVaultPolicyCheck();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("navigateToImport", () => {
    it("should navigate to tools/import when individualPolicy and tasks.importData are both false", async () => {
      component.isIndividualPolicyVault = false;
      (component as any).onboardingTasks$ = new BehaviorSubject<VaultOnboardingTasks>({
        createAccount: true,
        importData: false,
        installExtension: false,
      });
      const navigateSpy = jest.spyOn((component as any).router, "navigate").mockResolvedValue(true);

      const expected = ["tools/import"];
      await component.navigateToImport();
      expect(navigateSpy).toHaveBeenCalledWith(expected);
    });
  });
});
