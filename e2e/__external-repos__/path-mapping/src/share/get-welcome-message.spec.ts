import { getWelcomeMessage } from './get-welcome-message';

describe(`getWelcomeMessage()`, (): void => {
  let username: string;

  describe(`when the given username is a simple string`, (): void => {
    beforeEach(
      (): void => {
        username = `C0ZEN`;
      }
    );

    it(`should return a message for this username`, (): void => {
      expect.assertions(1);

      const result = getWelcomeMessage(username);

      expect(result).toStrictEqual(`yolo C0ZEN`);
    });
  });
});
