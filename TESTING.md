Start the backend project with

```bash
# sometimes you have to run it multiple times, because the DB is not set up at once.
npm run project:start
```

You can check the manual test case scenarios under `docs/testing` folder.

To start the E2E Tests, issue the following command:

```bash
npx playwright install --with-deps # install browser dependencies.
npx playwright test <YOUR_TEST_FILE> # use --headed flag, if you want to have a flickery UI screen as well.
```
