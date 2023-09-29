import { ElectronLogMainService } from "./electron-log.main.service";

describe("ElectronLogMainService", () => {
  it("sets dev based on electron method", () => {
    process.env.ELECTRON_IS_DEV = "1";
    const logService = new ElectronLogMainService();
    expect(logService).toEqual(expect.objectContaining({ isDev: true }) as any);
  });
});
