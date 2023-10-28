# A11yTester

Tool to test websites for A11y issues and HTML errors.

## Ideas for improvements

- Store the Urls from the sitemaps in the session file for quicker reruns.
- Export errors to a HTMl file (Use this code as inspiration: https://github.com/pa11y/pa11y/blob/main/lib/reporters/html.js)
- Write a tester to check for broken links.
  - Some inspiration:
    - https://github.com/cheeriojs/cheerio
    - https://github.com/stevenvachon/broken-link-checker
    - https://github.com/popomore/findlinks/blob/master/lib/checker.js#L121
    - https://github.com/pa11y/pa11y/blob/15b86374dd55fd4c1da2858adca9eef1df87f613/lib/runner.js#L178
- Make a cronjob with the following options:
  - Read Urls from a json file
  - Store the errors in a HTML file
  - Post to a slack channel if errors are encountered
