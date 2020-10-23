import { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { range } from "lodash";
import { AppModule } from "../../src/app.module";

describe("test7", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = testingModule.createNestApplication<NestExpressApplication>();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test.each(range(0, 100))("%i", () => {
    expect(true).toBe(true);
  });
});
