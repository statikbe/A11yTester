# A11yTester

Tool to test websites for A11y issues and HTML errors.

## Ideas for improvements

- Store the Urls from the sitemaps in the session file for quicker reruns.
- Identify all my fetches as a bot (https://developers.whatismybrowser.com/learn/browser-detection/user-agents/user-agent-best-practices)
- Export errors to a HTMl file (Use this code as inspiration: https://github.com/pa11y/pa11y/blob/main/lib/reporters/html.js)
- Make a cronjob with the following options:
  - Maybe make this a next.js project and host in on Vercel?
  - Read Urls from a json file
  - Store the errors in a HTML file
    - Make this beautiful and interactive.
    - Give the option to ignore certain errors from further reporting.
  - Post to a slack channel if errors are encountered
