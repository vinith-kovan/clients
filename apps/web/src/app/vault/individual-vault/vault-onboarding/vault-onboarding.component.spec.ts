import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { mock, MockProxy } from "jest-mock-extended";

import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { VaultOnboardingComponent } from "./vault-onboarding.component";

describe("VaultOnboardingComponent", () => {
  let component: VaultOnboardingComponent;
  let fixture: ComponentFixture<VaultOnboardingComponent>;
  let mockPlatformUtilsService: Partial<PlatformUtilsService>;
  let mockPolicyService: MockProxy<PolicyService>;
  let setInstallExtLinkSpy: any;
  let individualVaultPolicyCheckSpy: any;

  beforeEach(() => {
    mockPolicyService = mock<PolicyService>();
    mockPlatformUtilsService = {
      isChrome: jest.fn(),
      isFirefox: jest.fn(),
      isSafari: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [VaultOnboardingComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: PlatformUtilsService, useValue: mockPlatformUtilsService },
        { provide: PolicyService, useValue: mockPolicyService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VaultOnboardingComponent);
    component = fixture.componentInstance;
    individualVaultPolicyCheckSpy = jest
      .spyOn(component, "individualVaultPolicyCheck")
      .mockReturnValue(undefined);
    setInstallExtLinkSpy = jest.spyOn(component, "setInstallExtLink");
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

  describe("setInstallExtLink", () => {
    it("should set extensionUrl to Chrome Web Store when isChrome is true", () => {
      component.isChrome = true;
      const expected =
        "https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb";
      component.ngOnInit();
      expect(component.extensionUrl).toEqual(expected);
    });

    it("should set extensionUrl to Firefox Store when isFirefox is true", () => {
      component.isFirefox = true;
      const expected = "https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/";
      component.ngOnInit();
      expect(component.extensionUrl).toEqual(expected);
    });

    it("should set extensionUrl when isSafari is true", () => {
      component.isSafari = true;
      const expected = "https://apps.apple.com/us/app/bitwarden/id1352778147?mt=12";
      component.ngOnInit();
      expect(component.extensionUrl).toEqual(expected);
    });
  });

  describe("navigateToImport", () => {
    it("should navigate to tools/import when individualPolicy and tasks.importData are both false", () => {
      component.isIndividualPolicyVault = false;
      component.onboardingTasks = {
        createAccount: true,
        importData: false,
        installExtension: false,
      };
      const navigateSpy = jest.spyOn((component as any).router, "navigate").mockResolvedValue(true);
      const expected = ["tools/import"];
      component.navigateToImport();
      expect(navigateSpy).toHaveBeenCalledWith(expected);
    });
  });
});
