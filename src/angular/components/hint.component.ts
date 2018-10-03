import { Router } from '@angular/router';

import { Angulartics2 } from 'angulartics2';

import { PasswordHintRequest } from '../../models/request/passwordHintRequest';

import { ApiService } from '../../abstractions/api.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class HintComponent {
    email: string = '';
    formPromise: Promise<any>;

    protected successRoute = 'login';

    constructor(protected router: Router, protected analytics: Angulartics2,
        protected i18nService: I18nService, protected apiService: ApiService,
        protected platformUtilsService: PlatformUtilsService) { }

    async submit() {
        if (this.email == null || this.email === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('emailRequired'));
            return;
        }
        if (this.email.indexOf('@') === -1) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidEmail'));
            return;
        }

        try {
            this.formPromise = this.apiService.postPasswordHint(new PasswordHintRequest(this.email));
            await this.formPromise;
            this.analytics.eventTrack.next({ action: 'Requested Hint' });
            this.platformUtilsService.showToast('success', null, this.i18nService.t('masterPassSent'));
            this.router.navigate([this.successRoute]);
        } catch { }
    }
}
