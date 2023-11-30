import { Injectable } from "@angular/core";
import { concatMap, map, BehaviorSubject, Observable } from "rxjs";

import { StateService } from "../core/state";

@Injectable()
export class BannerService {
  private bannerStatesSubject = new BehaviorSubject<{ [id: string]: boolean }>({});
  bannerStates$ = this.bannerStatesSubject.asObservable();

  constructor(private stateService: StateService) {
    this.stateService.activeAccountUnlocked$.pipe(
      concatMap(async (unlocked) => {
        if (!unlocked) {
          this.bannerStatesSubject.next({});
        }

        const data = await this.stateService.getBannerStates();
        this.bannerStatesSubject.next(data);
      })
    );
  }

  get$(id: string): Observable<boolean | undefined> {
    return this.bannerStates$.pipe(map((banners) => banners[id]));
  }

  get(id: string): boolean | undefined {
    const banners = this.bannerStatesSubject.value;
    return banners[id];
  }

  async set(id: string, value: boolean) {
    let bannerStates = await this.stateService.getBannerStates();
    if (bannerStates === null || bannerStates === undefined) {
      bannerStates = {
        [id]: value,
      };
    } else {
      bannerStates[id] = value;
    }
    await this.stateService.setBannerStates(bannerStates);
    this.bannerStatesSubject.next(bannerStates);
  }
}
