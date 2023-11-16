# A11yTester

Tool to test websites for A11y issues, HTML errors and broken links.

## Setup

## Ideas for improvements

- Combine the fetch of all the urls and body content in the production. So we don't make unnecessary calls.
- Make a cronjob with the following options:
  - Maybe make this a next.js project and host in on Vercel?
  - Read Urls from a json file
  - Store the errors in a HTML file
    - Make this beautiful and interactive.
    - Give the option to ignore certain errors from further reporting.
  - Post to a slack channel if errors are encountered (https://dev.to/hrishikeshps/send-slack-notifications-via-nodejs-3ddn)
